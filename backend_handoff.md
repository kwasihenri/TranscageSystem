# Transcage — Backend Handoff Document

> **To the backend engineer:** You are building the server for a **live demo** of Transcage, a parcel logistics platform.
> The demo will be used for a real presentation. Build it **quickly** but treat it like **production code** —
> proper error handling, real JWT auth, real MySQL queries, no shortcuts on security.
> The frontend is fully built and wired; it only needs the backend to be live and responding correctly.

---

## 1. Project Overview

**Transcage** is a parcel courier and logistics system for intercity cargo.

### Roles
| Role | Capabilities |
|---|---|
| `customer` | Book parcels, track, view history |
| `clerk` | Scan/check-in parcels, manage manifests, verify receiver OTP |
| `driver` | View assigned jobs, mark arrival, voice-call receiver |
| `admin` | Full parcel/driver/station/reports oversight |

### Tech Stack
- **Backend**: Node.js + Express
- **Database**: MySQL (use `mysql2` with connection pool)
- **Auth**: JWT (Bearer token in `Authorization` header)
- **Port**: `4000` (frontend proxies `/api` → `localhost:4000`)

---

## 2. Environment & Config

Create a `.env` file in the backend root:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=transcage
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=a_long_random_secret_here
JWT_EXPIRES_IN=7d
```

The frontend reads `VITE_API_URL` — leave it unset in development; Vite proxies `/api` to `localhost:4000`.

---

## 3. Database Schema

```sql
CREATE TABLE users (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  name         VARCHAR(120) NOT NULL,
  phone        VARCHAR(20)  NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('customer','clerk','driver','admin') NOT NULL DEFAULT 'customer',
  station_id   VARCHAR(36)  NULL,
  vehicle_no   VARCHAR(30)  NULL,
  is_available BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stations (
  id   VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(20)  NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80)  NOT NULL,
  lat  DECIMAL(9,6) NOT NULL,
  lng  DECIMAL(9,6) NOT NULL
);

CREATE TABLE parcels (
  id                   VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  tracking_id          VARCHAR(30)  NOT NULL UNIQUE,
  sender_id            VARCHAR(36)  NOT NULL REFERENCES users(id),
  sender_name          VARCHAR(120) NOT NULL,
  receiver_name        VARCHAR(120) NOT NULL,
  receiver_phone       VARCHAR(20)  NOT NULL,
  origin_station       VARCHAR(36)  NOT NULL REFERENCES stations(id),
  destination_station  VARCHAR(36)  NOT NULL REFERENCES stations(id),
  delivery_type        ENUM('intercity','intra-city') NOT NULL DEFAULT 'intercity',
  description          TEXT         NULL,
  category             VARCHAR(60)  NULL,
  weight               VARCHAR(20)  NULL,
  fragile              BOOLEAN      NOT NULL DEFAULT FALSE,
  status               ENUM('created','at_origin','in_transit','at_destination','delivered') NOT NULL DEFAULT 'created',
  otp                  CHAR(6)      NOT NULL,
  fee                  DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcel_history (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  parcel_id    VARCHAR(36)  NOT NULL REFERENCES parcels(id),
  status       VARCHAR(40)  NOT NULL,
  note         TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE manifests (
  id                   VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  origin_station       VARCHAR(36)  NOT NULL REFERENCES stations(id),
  destination_station  VARCHAR(36)  NOT NULL REFERENCES stations(id),
  driver_id            VARCHAR(36)  NULL REFERENCES users(id),
  driver_name          VARCHAR(120) NULL,
  status               ENUM('open','dispatched','arrived') NOT NULL DEFAULT 'open',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dispatched_at        DATETIME     NULL,
  arrived_at           DATETIME     NULL
);

CREATE TABLE manifest_parcels (
  manifest_id  VARCHAR(36) NOT NULL REFERENCES manifests(id),
  parcel_id    VARCHAR(36) NOT NULL REFERENCES parcels(id),
  PRIMARY KEY (manifest_id, parcel_id)
);

CREATE TABLE driver_locations (
  driver_id    VARCHAR(36)  PRIMARY KEY REFERENCES users(id),
  lat          DECIMAL(9,6) NOT NULL,
  lng          DECIMAL(9,6) NOT NULL,
  manifest_id  VARCHAR(36)  NULL REFERENCES manifests(id),
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE call_sessions (
  id             VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  parcel_id      VARCHAR(36)  NOT NULL REFERENCES parcels(id),
  caller_id      VARCHAR(36)  NOT NULL REFERENCES users(id),
  callee_id      VARCHAR(36)  NOT NULL REFERENCES users(id),
  status         ENUM('pending','accepted','declined','ended') NOT NULL DEFAULT 'pending',
  offer_sdp      LONGTEXT     NULL,
  answer_sdp     LONGTEXT     NULL,
  ice_candidates LONGTEXT     NOT NULL DEFAULT '[]',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Seed the `stations` table** with this data (the frontend references these exact codes):

| code | name | city | lat | lng |
|---|---|---|---|---|
| `acc-central` | Accra Central Station | Accra | 5.5502 | -0.2174 |
| `ksi-asafo` | Kumasi Asafo Terminal | Kumasi | 6.6880 | -1.6244 |
| `tad-stc` | Takoradi STC Terminal | Takoradi | 4.9048 | -1.7692 |
| `tma-central` | Tamale Central Bus Terminal | Tamale | 9.4008 | -0.8393 |
| `cco-unt` | Cape Coast UCC Terminal | Cape Coast | 5.1037 | -1.2764 |
| `sbo-market` | Sunyani Market Station | Sunyani | 7.3349 | -2.3266 |
| `kof-road` | Koforidua Bus Station | Koforidua | 6.0940 | -0.2607 |

---

## 4. ID & OTP Generation

**Tracking ID** — generate server-side, ensure DB uniqueness:
```js
function generateTrackingId() {
  const year = new Date().getFullYear()
  const num  = String(Math.floor(10000 + Math.random() * 90000))
  return `TC-${year}-${num}`
}
```

**OTP** — 6-digit numeric, stored in `parcels.otp`. Return it in the parcel response for the demo (receiver reads it off their screen). In production this would be SMS'd.
```js
const otp = String(Math.floor(100000 + Math.random() * 900000))
```

---

## 5. Complete API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <jwt>`.

### 5.1 Auth

```
POST /api/auth/register
  Body: { name, phone, password, role? }
  → 201 { user: { id, name, phone, role }, token }

POST /api/auth/login
  Body: { phone, password }
  → 200 { user: { id, name, phone, role, station?, vehicle? }, token }

GET  /api/auth/me  [protected]
  → 200 { id, name, phone, role, station?, vehicle? }
```

### 5.2 Public Tracking

```
GET /api/track/:trackingId  [NO auth — public]
  → 200 {
      trackingId, status, description, category, weight, fragile,
      deliveryType, originStation, destinationStation,
      senderName, receiverName, createdAt, otp,
      history: [{ status, note, timestamp }]
    }
  → 404 { message: "Parcel not found." }
```

### 5.3 Parcels — Customer

```
POST /api/parcels  [protected: customer]
  Body: {
    receiverName, receiverPhone,
    originStation, destinationStation,
    deliveryType, description, category, weight, fragile,
    senderId, senderName
  }
  → 201 { id, trackingId, status:'created', otp, createdAt, ...all fields,
           history: [{ status:'created', note, timestamp }] }

GET  /api/parcels/mine  [protected: customer]
  → 200 [ ...parcel objects, each including history array ]

GET  /api/parcels/:id   [protected: any role]
  :id may be trackingId OR the UUID
  → 200 { ...full parcel with history }

POST /api/parcels/collect  [public]
  Body: { trackingId, phone, otp }
  Validates: phone matches receiver_phone, otp matches, status is 'at_destination'
  → 200 { ...updated parcel }
  → 400 { message: "Phone number does not match..." | "Incorrect OTP..." | ... }
```

### 5.4 Clerk

```
GET  /api/clerk/parcels      [protected: clerk]
  → 200 [ ...all parcels at clerk's station (origin OR destination) ]

POST /api/clerk/check-in     [protected: clerk]
  Body: { trackingId }
  Transitions:
    'created'    → 'at_origin'      + history note
    'in_transit' → 'at_destination' + history note
    any other    → 400 error
  → 200 { ...updated parcel with full history }

POST /api/clerk/verify-otp   [protected: clerk]
  Body: { trackingId, otp }
  Validates: status = 'at_destination', otp matches
  Transitions: 'at_destination' → 'delivered'
  → 200 { ...updated parcel with full history }
  → 400 { message: "Incorrect OTP." | ... }
```

### 5.5 Manifests

```
GET  /api/manifests              [protected: clerk | driver | admin]
  → 200 [ { id, originStation, destinationStation, driverName, status,
             createdAt, dispatchedAt, arrivedAt, parcels: [trackingId, ...] } ]

POST /api/manifests              [protected: clerk]
  Body: { originStation, destinationStation, driverName }
  → 201 { id, originStation, destinationStation, driverName,
           status:'open', createdAt, parcels:[] }

GET  /api/manifests/:id          [protected: clerk | driver | admin]
  → 200 { ...manifest with parcels array of trackingIds }

POST /api/manifests/:id/parcels  [protected: clerk]
  Body: { trackingId }
  Validates: parcel status = 'at_origin', manifest status = 'open'
  → 200 { ...manifest with updated parcels array }

POST /api/manifests/:id/dispatch [protected: clerk]
  Validates: manifest is 'open', has >= 1 parcel
  Transitions: manifest → 'dispatched', all parcels → 'in_transit'
  → 200 { ...updated manifest }

POST /api/manifests/:id/arrive   [protected: driver]
  Validates: manifest is 'dispatched'
  Transitions: manifest → 'arrived', all parcels → 'at_destination'
  → 200 { ...updated manifest }
```

### 5.6 Driver

```
GET   /api/driver/jobs              [protected: driver]
  Returns manifests for req.user.id WHERE status IN ('dispatched','arrived')
  → 200 [ ...manifest objects ]

POST  /api/driver/location          [protected: driver]
  Body: { lat, lng, manifestId? }
  Upserts driver_locations
  → 200 { lat, lng, updatedAt }

GET   /api/driver/location/:driverId [protected: any]
  → 200 { lat, lng, updatedAt }

PATCH /api/driver/availability      [protected: driver]
  Body: { available: boolean }
  → 200 { available }
```

### 5.7 Admin

```
GET /api/admin/parcels   [protected: admin]
  → 200 [ ...all parcels with history ]

GET /api/admin/stats     [protected: admin]
  → 200 {
      totalParcels, inTransit, atStations,
      deliveredToday, totalDelivered, activeManifests, stations
    }

GET /api/admin/stations  [protected: admin]
  → 200 [ { ...station, atStation, totalIn, totalOut } ]

GET /api/admin/reports   [protected: admin]
  → 200 {
      parcels: [...],
      byStatus: { created, at_origin, in_transit, at_destination, delivered },
      completionRate: number,
      byCategory: { [category]: count },
      manifests: [...],
      recentDeliveries: [...last 10 delivered]
    }

GET /api/admin/drivers   [protected: admin]
  → 200 [
      { id, name, phone,
        status: 'online'|'offline',
        station, trips, parcels, rating }
    ]
```

### 5.8 WebRTC Call Signaling

```
POST   /api/calls/initiate     [protected: driver]
  Body: { parcelId }
  Look up parcel → find user where phone = parcel.receiver_phone
  Create call_session row: caller_id=driver, callee_id=receiver
  → 201 { callId, receiverName }

GET    /api/calls/incoming     [protected: customer | clerk]
  Returns the latest pending call where callee_id = req.user.id
  → 200 { callId, offer: { type, sdp }, callerName }
       OR 200 null  (NOT 404 — the frontend polls this every 5 seconds)

GET    /api/calls/:id          [protected: driver | callee]
  → 200 {
      status,
      offer:    { type, sdp } | null,
      answer:   { type, sdp } | null,
      iceCandidates: [ ...RTCIceCandidateInit objects ]
    }

PUT    /api/calls/:id/offer    [protected: driver]
  Body: { sdp: { type, sdp } }
  → 200 { ok: true }

PUT    /api/calls/:id/answer   [protected: callee]
  Body: { sdp: { type, sdp } }
  Sets call status → 'accepted'
  → 200 { ok: true }

POST   /api/calls/:id/ice      [protected: driver | callee]
  Body: { candidate: { ...RTCIceCandidateInit } }
  Appends to ice_candidates JSON array
  → 200 { ok: true }

DELETE /api/calls/:id          [protected: driver | callee]
  Sets status → 'ended'
  → 200 { ok: true }
```

---

## 6. Response Conventions

- **All errors**: `{ message: "Human-readable explanation" }` with correct HTTP status code (400, 401, 403, 404, 409, 500).
- **All timestamps**: ISO 8601 strings (`new Date().toISOString()`), not raw MySQL `DATETIME` format.
- **Parcel responses**: Any endpoint that modifies a parcel must return the **full parcel object including the `history` array** (JOIN from `parcel_history`).
- **`/api/calls/incoming`**: Returns `null` (200) when no call is pending — never 404. The frontend polls this route every 5 seconds.

---

## 7. Auth Middleware

```js
// middleware/auth.js
const jwt = require('jsonwebtoken')

function auth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token)
      return res.status(401).json({ message: 'Authentication required.' })
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      if (roles.length && !roles.includes(payload.role))
        return res.status(403).json({ message: 'Forbidden.' })
      req.user = payload   // { id, name, phone, role, ... }
      next()
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token.' })
    }
  }
}

module.exports = auth
// Usage: router.post('/clerk/check-in', auth(['clerk']), handler)
```

---

## 8. Parcel Status Machine

**Only these transitions are valid. Reject anything else with 400.**

```
created  ──────────────────────► at_origin        (clerk check-in at origin)
at_origin ─────────────────────► in_transit        (manifest dispatch)
in_transit ────────────────────► at_destination    (manifest arrive OR clerk check-in at dest.)
at_destination ────────────────► delivered         (clerk verify-otp OR customer /collect)
```

---

## 9. What to Replace From the Frontend (Cleanup Map)

The frontend currently has DEV-mode localStorage fallbacks for every service. These will be **bypassed automatically** once the backend responds correctly. The frontend owner will strip the fallback code after you confirm the API is live.

| Frontend file | Faked with localStorage | Your replacement endpoint |
|---|---|---|
| `parcel.service.js` | Generated tracking IDs, OTPs, hardcoded TC-DEMO-00001/00002, localStorage CRUD | `POST /api/parcels`, `GET /api/parcels/mine`, `GET /api/track/:id`, `GET /api/parcels/:id` |
| `parcel.service.js` | Client-side OTP validation in `verifyReceiverOTP` | `POST /api/parcels/collect` |
| `clerk.service.js` | localStorage check-in / dispatch / OTP verify / manifest CRUD | All `/api/clerk/*` and `/api/manifests/*` routes |
| `driver.service.js` | localStorage availability boolean, localStorage location object, localStorage manifest filtering | `/api/driver/jobs`, `/api/driver/location`, `/api/manifests/:id/arrive`, `PATCH /api/driver/availability` |
| `admin.service.js` | Hardcoded demo driver roster, localStorage seed parcels merged with 7 hardcoded past deliveries | All `/api/admin/*` routes |
| `AuthContext.jsx` | `DEMO_ACCOUNTS` array used as fallback when login 401s | `POST /api/auth/login` returning real user + valid JWT |

---

## 10. Demo Seed Users

Seed these accounts so the demo login works immediately for all roles:

```sql
-- Use bcrypt to hash the plaintext passwords below before inserting
-- ('admin1234', 'clerk1234', 'driver1234', 'cust1234')
INSERT INTO users (id, name, phone, password, role) VALUES
  ('u-001', 'Admin User',   '0200000001', '<bcrypt(admin1234)>',  'admin'),
  ('u-002', 'Kwame Asante', '0200000002', '<bcrypt(clerk1234)>',  'clerk'),
  ('u-003', 'Kofi Mensah',  '0200000003', '<bcrypt(driver1234)>', 'driver'),
  ('u-004', 'Abena Osei',   '0200000004', '<bcrypt(cust1234)>',   'customer');
```

Also seed 5–7 parcels in various statuses (created, at_origin, in_transit, at_destination, delivered) so the admin dashboard, tracking page, and clerk scan all show real live data on first open.

---

## 11. Recommended Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # mysql2 pool — export { query }
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── parcel.routes.js
│   │   ├── manifest.routes.js
│   │   ├── clerk.routes.js
│   │   ├── driver.routes.js
│   │   ├── admin.routes.js
│   │   └── call.routes.js
│   ├── controllers/           # one per route file
│   ├── services/
│   │   ├── parcel.service.js  # status machine, tracking ID gen, OTP gen
│   │   └── call.service.js    # ice candidate merge logic
│   └── app.js                 # express setup
├── database/
│   ├── schema.sql
│   └── seed.sql
├── .env.example
└── package.json
```

---

## 12. CORS

```js
const cors = require('cors')
app.use(cors({
  origin: ['http://localhost:5173', /^http:\/\/192\.168\./],
  credentials: true,
}))
```

---

## 13. Final Integration Checklist

- [ ] Server starts cleanly on PORT 4000
- [ ] All 7 stations seeded with the exact `code` values listed above
- [ ] Demo users seeded — login works for all 4 roles
- [ ] `POST /api/auth/login` returns `{ user, token }` matching the shape above
- [ ] `GET /api/track/:id` works **without** an Authorization header
- [ ] `POST /api/parcels` returns `otp` field (displayed on booking confirmation screen)
- [ ] Every parcel mutation returns the full parcel including `history` array
- [ ] `GET /api/calls/incoming` returns `null` (not 404) when no call is pending
- [ ] Status machine rejects invalid transitions with a 400 + readable message
- [ ] `.env` is in `.gitignore`; `.env.example` is committed
