# Zply Final Release

Production-style HTML/CSS/JS e-commerce frontend with Firebase Firestore + Firebase Authentication.

## Fixed in this release

- No emoji UI icons. UI uses inline SVG icons.
- Menu / three-line button works.
- Search works.
- Cart works.
- Product details work.
- Quantity + size selection works.
- Checkout works.
- Division → District selection works.
- Thana / Upazila is typed manually.
- Delivery Address accepts Road / House / Floor / Area etc.
- Dhaka City delivery = 70 BDT.
- Outside Dhaka City delivery = 120 BDT.
- Cash on Delivery.
- Orders are stored in Firestore.
- Order History is included.
- Each order receives an Order ID + Tracking Code.
- Public tracking shows status only; customer phone/address are not exposed.
- Admin can update order status.
- Admin can add/edit/delete categories.
- Categories are NOT hardcoded in the frontend.
- Admin can add/edit/delete products.
- Products and categories load from Firestore.
- Cart persists in localStorage.
- Search is dynamic.
- Responsive mobile/desktop UI.
- Firebase Authentication protects admin panel.
- Firestore rules prevent public reading of customer orders.

## Firebase setup

The Firebase project config supplied in the request is already in `app.js`.

### 1. Enable Firestore

Firebase Console → Firestore Database → Create database.

### 2. Publish rules

Copy `firestore.rules` into Firebase Console → Firestore Database → Rules → Publish.

### 3. Enable Admin Login

Firebase Console → Authentication → Sign-in method → enable Email/Password.

Create your admin user in Authentication → Users.

Copy that user's UID.

In Firestore create:

`admins/{YOUR_ADMIN_UID}`

The document can contain:

`role: "admin"`

The rules intentionally do NOT allow an anonymous user to create their own admin document.

### 4. Add categories

Open the website → Menu → Admin Panel → login.

Go to Categories → Add Category.

Nothing is pre-created in the frontend. Categories come from Firestore.

### 5. Add products

Admin Panel → Products → Add Product.

Choose an existing category, add product name, price, image URL, sizes and description.

## Order workflow

Customer:
1. Selects product.
2. Selects size and quantity.
3. Adds to cart.
4. Checkout.
5. Selects Division.
6. Selects District.
7. Types Thana/Upazila.
8. Selects Dhaka City (70 BDT) or Outside Dhaka City (120 BDT).
9. Types detailed Delivery Address.
10. Confirms order.

Firestore creates:

`orders/{autoId}`

and a status-only tracking document:

`orderTracking/{trackingCode}`

The tracking document does not contain customer phone, address or other private order details.

### Order History

The browser saves the user's own order IDs + tracking codes locally.

The History page can refresh the current status from the public status-only tracking document.

If local browser history is cleared, the customer can still enter the Order ID + Tracking Code manually.

### Admin order statuses

Admin can set:

- Pending
- Confirmed
- Processing
- Shipped
- Delivered
- Cancelled

The customer sees the updated status in Order History.

## Run locally

Do not open `index.html` directly with `file://`.

Use VS Code + Live Server, or deploy to Firebase Hosting / another static host.

## Important production note

The Firebase web API key is normally visible in browser JavaScript. That is expected for Firebase web apps. Security comes from Authentication and Firestore Security Rules.

For a larger production store, add server-side payment/order validation and abuse/rate limiting.

## Files

- index.html
- styles.css
- app.js
- firestore.rules
- README.md
- assets/premium-shirt.jpg
- assets/boys-collection.jpg
- assets/girls-collection.jpg
