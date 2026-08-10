import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyBp8MU0V6FQvmcSvTW03D1g4-lGMvrO64w",authDomain:"zply-86305.firebaseapp.com",projectId:"zply-86305",storageBucket:"zply-86305.firebasestorage.app",messagingSenderId:"397123073229",appId:"1:397073229:web:3c2fe230113701dd01a584",measurementId:"G-26C9TQ4389"};
/* The appId above is normalized below from the supplied Firebase configuration. */
firebaseConfig.appId="1:397123073229:web:3c2fe230113701dd01a584";

const app=initializeApp(firebaseConfig);
const db=getFirestore(app), auth=getAuth(app);
isSupported().then(ok=>{if(ok)getAnalytics(app)}).catch(()=>{});

const $=id=>document.getElementById(id);
const money=n=>`${Number(n||0).toLocaleString("en-BD")} BDT`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fallbackImage="assets/premium-shirt.jpg";
let categories=[],products=[],selectedProduct=null,selectedSize="",currentFilter="All",cart=JSON.parse(localStorage.getItem("zply_cart")||"[]"),orderBusy=false;

const divisions={"ঢাকা":["ঢাকা","গাজীপুর","নারায়ণগঞ্জ","নরসিংদী","টাঙ্গাইল","কিশোরগঞ্জ","মুন্সিগঞ্জ","মানিকগঞ্জ","মাদারীপুর","গোপালগঞ্জ","শরীয়তপুর","রাজবাড়ী","ফরিদপুর"],"চট্টগ্রাম":["চট্টগ্রাম","কক্সবাজার","কুমিল্লা","ব্রাহ্মণবাড়িয়া","চাঁদপুর","ফেনী","নোয়াখালী","লক্ষ্মীপুর","রাঙ্গামাটি","খাগড়াছড়ি","বান্দরবান"],"রাজশাহী":["রাজশাহী","বগুড়া","জয়পুরহাট","নওগাঁ","নাটোর","চাঁপাইনবাবগঞ্জ","পাবনা","সিরাজগঞ্জ"],"খুলনা":["খুলনা","বাগেরহাট","চুয়াডাঙ্গা","যশোর","ঝিনাইদহ","কুষ্টিয়া","মাগুরা","মেহেরপুর","নড়াইল","সাতক্ষীরা"],"বরিশাল":["বরিশাল","ভোলা","ঝালকাঠি","পটুয়াখালী","পিরোজপুর","বরগুনা"],"সিলেট":["সিলেট","হবিগঞ্জ","মৌলভীবাজার","সুনামগঞ্জ"],"রংপুর":["রংপুর","দিনাজপুর","গাইবান্ধা","কুড়িগ্রাম","লালমনিরহাট","নীলফামারী","পঞ্চগড়","ঠাকুরগাঁও"],"ময়মনসিংহ":["ময়মনসিংহ","জামালপুর","নেত্রকোণা","শেরপুর"]};
const statuses=["pending","confirmed","processing","shipped","delivered","cancelled"];
const statusBn={pending:"Pending",confirmed:"Confirmed",processing:"Processing",shipped:"Shipped",delivered:"Delivered",cancelled:"Cancelled"};

function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2400)}
function saveCart(){localStorage.setItem("zply_cart",JSON.stringify(cart));updateCartCount();renderCart();renderCheckout()}
function updateCartCount(){$("cartCount").textContent=cart.reduce((n,i)=>n+i.qty,0)}
function showPage(name){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));const p=$(name+"Page");if(p)p.classList.add("active");window.scrollTo({top:0,behavior:"smooth"});if(name==="cart")renderCart();if(name==="checkout")renderCheckout();if(name==="history")renderHistory()}
function closeDrawer(){$("sideMenu").classList.remove("open");$("overlay").classList.remove("show")}
function openModal(id){$(id).classList.add("show")}
function closeModal(id){$(id).classList.remove("show")}

function getDelivery(){return $("deliveryZone")?.value==="outside"?120:70}
function productCard(p){
 const save=Math.max(0,(Number(p.oldPrice)||0)-Number(p.price||0));
 return `<article class="product-card" data-product="${esc(p.id)}">${save?`<div class="badge">Save ${save} BDT</div>`:""}<img src="${esc(p.imageUrl||fallbackImage)}" alt="${esc(p.name)}" onerror="this.src='${fallbackImage}'"><div class="product-content"><h3>${esc(p.name)}</h3><strong>${money(p.price)}</strong>${p.oldPrice?` <del>${money(p.oldPrice)}</del>`:""}</div></article>`
}
function renderHome(){
 $("categoryGrid").innerHTML=categories.length?categories.map(c=>`<button class="category-card" data-category="${esc(c.name)}"><img src="${esc(c.imageUrl||fallbackImage)}" alt="${esc(c.name)}" onerror="this.src='${fallbackImage}'"><span>${esc(c.name)}</span></button>`).join(""):`<div class="empty">কোনো category এখনো যোগ করা হয়নি। Admin Panel থেকে category যোগ করুন।</div>`;
 $("featuredProducts").innerHTML=products.length?products.slice(0,8).map(productCard).join(""):`<div class="empty">কোনো product এখনো যোগ করা হয়নি।</div>`;
 bindProductCards();
}
function renderProducts(){
 const list=currentFilter==="All"?products:products.filter(p=>p.category===currentFilter);
 $("productsGrid").innerHTML=list.length?list.map(productCard).join(""):`<div class="empty">এই category-তে কোনো product নেই।</div>`;
 bindProductCards();
}
function bindProductCards(){document.querySelectorAll(".product-card").forEach(c=>c.onclick=()=>openDetail(c.dataset.product));}
function renderDrawerCategories(){
 $("drawerCategories").innerHTML=categories.length?categories.map(c=>`<button class="drawer-cat" data-category="${esc(c.name)}">${esc(c.name)}</button>`).join(""):"No categories yet";
}
function openDetail(id){
 const p=products.find(x=>x.id===id);if(!p){toast("Product পাওয়া যায়নি");return}
 selectedProduct=p;selectedSize=(p.sizes&&p.sizes[0])||"";
 $("detailImage").src=p.imageUrl||fallbackImage;$("detailImage").alt=p.name;$("zoomImage").src=p.imageUrl||fallbackImage;
 $("detailName").textContent=p.name;$("detailCrumb").textContent=p.name;$("detailPrice").textContent=money(p.price);
 $("detailOldPrice").textContent=p.oldPrice?money(p.oldPrice):"";$("detailSave").textContent=p.oldPrice&&p.oldPrice>p.price?`Save ${p.oldPrice-p.price} BDT`:"";
 $("sizeOptions").innerHTML=(p.sizes?.length?p.sizes:["Default"]).map((s,i)=>`<button class="size ${i===0?"active":""}" data-size="${esc(s)}">${esc(s)}</button>`).join("");
 document.querySelectorAll("#sizeOptions .size").forEach(b=>b.onclick=()=>{document.querySelectorAll("#sizeOptions .size").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedSize=b.dataset.size});
 $("detailDescription").innerHTML=p.description?`<p>${esc(p.description).replace(/\n/g,"<br>")}</p>`:"";
 $("qtyInput").value=1;showPage("detail");
}
function addSelected(go){
 if(!selectedProduct)return;
 const qty=Math.max(1,Math.min(10,Number($("qtyInput").value)||1)),size=selectedSize||"Default";
 const old=cart.find(i=>i.id===selectedProduct.id&&i.size===size);
 if(old)old.qty=Math.min(10,old.qty+qty);else cart.push({id:selectedProduct.id,name:selectedProduct.name,price:Number(selectedProduct.price),image:selectedProduct.imageUrl||fallbackImage,size,qty});
 saveCart();toast("পণ্যটি কার্টে যোগ হয়েছে");if(go)showPage("checkout");
}
function renderCart(){
 if(!cart.length){$("cartItems").innerHTML=`<div class="form-card empty"><h2>No items in your cart</h2><button class="primary-btn" data-page="products">Add more items</button></div>`}
 else $("cartItems").innerHTML=cart.map((i,n)=>`<div class="cart-item"><img src="${esc(i.image)}" alt="${esc(i.name)}"><div><h3>${esc(i.name)}</h3><div>Size: ${esc(i.size)}</div><div>${money(i.price)} × ${i.qty}</div></div><button class="remove" data-remove="${n}">Remove</button></div>`).join("");
 const sub=cart.reduce((s,i)=>s+i.price*i.qty,0),d=cart.length?getDelivery():0;$("subtotal").textContent=money(sub);$("cartDelivery").textContent=money(d);$("cartTotal").textContent=money(sub+d);
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);saveCart()});
}
function renderCheckout(){
 if(!cart.length){$("checkoutSummary").innerHTML="<p>কার্ট খালি।</p>";$("checkoutTotal").textContent="0 BDT";return}
 $("checkoutSummary").innerHTML=cart.map(i=>`<div class="delivery-line"><span>${esc(i.name)} (${esc(i.size)}) × ${i.qty}</span><strong>${money(i.price*i.qty)}</strong></div>`).join("");
 const sub=cart.reduce((s,i)=>s+i.price*i.qty,0),d=getDelivery();$("checkoutDelivery").textContent=money(d);$("checkoutTotal").textContent=money(sub+d)
}
function initLocation(){
 $("division").innerHTML='<option value="">বিভাগ নির্বাচন করুন</option>'+Object.keys(divisions).map(d=>`<option>${d}</option>`).join("");
 $("division").onchange=()=>{const d=divisions[$("division").value]||[];$("district").disabled=!d.length;$("district").innerHTML=d.length?'<option value="">জেলা নির্বাচন করুন</option>'+d.map(x=>`<option>${x}</option>`).join(""):'<option value="">আগে বিভাগ নির্বাচন করুন</option>'};
 $("deliveryZone").onchange=renderCheckout;
}

function newTracking(){const a=new Uint8Array(9);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(36).padStart(2,"0")).join("").toUpperCase().slice(0,12)}
function saveLocalOrder(o){const list=JSON.parse(localStorage.getItem("zply_order_history")||"[]");list.unshift(o);localStorage.setItem("zply_order_history",JSON.stringify(list.slice(0,30)))}
function getLocalOrders(){return JSON.parse(localStorage.getItem("zply_order_history")||"[]")}
function statusTimeline(status){const order=["pending","confirmed","processing","shipped","delivered"];if(status==="cancelled")return `<span class="step done">Cancelled</span>`;const idx=order.indexOf(status);return order.map((s,i)=>`<span class="step ${i<=idx?"done":""}">${statusBn[s]}</span>`).join("")}
async function refreshTracking(o){
 try{const snap=await getDoc(doc(db,"orderTracking",o.trackingCode));if(snap.exists()){o.status=snap.data().status||o.status;o.updatedAt=snap.data().updatedAt||o.updatedAt;return true}}catch(e){}
 return false
}
async function renderHistory(){
 let list=getLocalOrders();
 const enteredId=$("historyId").value.trim(),enteredCode=$("historyCode").value.trim().toUpperCase();
 if(enteredId||enteredCode) list=list.filter(o=>(!enteredId||o.orderId.toLowerCase()===enteredId.toLowerCase())&&(!enteredCode||o.trackingCode===enteredCode));
 if(!list.length){$("historyList").innerHTML='<div class="empty">কোনো order history পাওয়া যায়নি। Order ID + Tracking Code দিয়ে status check করুন।</div>';return}
 $("historyList").innerHTML=list.map(o=>`<div class="history-card"><div class="history-head"><div><b>Order ID: ${esc(o.orderId)}</b><div class="order-mini">Tracking: ${esc(o.trackingCode)}</div></div><span class="status ${esc(o.status)}">${statusBn[o.status]||esc(o.status)}</span></div><div>${money(o.total)}</div><div class="timeline">${statusTimeline(o.status)}</div></div>`).join("");
 for(const o of list)if(await refreshTracking(o)){}
 const all=getLocalOrders();list.forEach(o=>{const i=all.findIndex(x=>x.orderId===o.orderId);if(i>=0)all[i].status=o.status});localStorage.setItem("zply_order_history",JSON.stringify(all));
 $("historyList").innerHTML=list.map(o=>`<div class="history-card"><div class="history-head"><div><b>Order ID: ${esc(o.orderId)}</b><div class="order-mini">Tracking: ${esc(o.trackingCode)}</div></div><span class="status ${esc(o.status)}">${statusBn[o.status]||esc(o.status)}</span></div><div>${money(o.total)}</div><div class="timeline">${statusTimeline(o.status)}</div></div>`).join("");
}
async function placeOrder(e){
 e.preventDefault();if(orderBusy)return;if(!cart.length){toast("কার্ট খালি");showPage("products");return}
 const phone=$("phone").value.replace(/[\s-]/g,"");if(!/^01[3-9]\d{8}$/.test(phone)){toast("সঠিক বাংলাদেশি মোবাইল নম্বর দিন");return}
 orderBusy=true;const btn=$("placeOrderBtn");btn.disabled=true;btn.textContent="ORDERING…";
 const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0),delivery=getDelivery(),trackingCode=newTracking();
 const payload={customerName:$("customerName").value.trim(),phone,division:$("division").value,district:$("district").value,thana:$("thana").value.trim(),deliveryZone:$("deliveryZone").value==="dhaka"?"Dhaka City":"Outside Dhaka City",deliveryCharge:delivery,deliveryAddress:$("address").value.trim(),note:$("note").value.trim(),items:cart.map(i=>({id:i.id,name:i.name,size:i.size,qty:i.qty,price:i.price})),subtotal,total:subtotal+delivery,paymentMethod:"Cash on Delivery",status:"pending",trackingCode,createdAt:serverTimestamp()};
 try{
  const ref=await addDoc(collection(db,"orders"),payload);
  await setDoc(doc(db,"orderTracking",trackingCode),{orderId:ref.id,status:"pending",updatedAt:serverTimestamp()});
  saveLocalOrder({orderId:ref.id,trackingCode,status:"pending",total:subtotal+delivery,createdAt:new Date().toISOString()});
  $("successOrderId").textContent=ref.id;$("orderForm").reset();$("district").disabled=true;cart=[];saveCart();showPage("success");
 }catch(err){console.error(err);toast("Order save হয়নি। Firebase Firestore setup/rules check করুন।")}
 finally{orderBusy=false;btn.disabled=false;btn.textContent="CONFIRM ORDER"}
}

async function loadPublicData(){
 try{
  const [cs,ps]=await Promise.all([getDocs(collection(db,"categories")),getDocs(collection(db,"products"))]);
  categories=cs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  products=ps.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  renderHome();renderProducts();renderDrawerCategories();populateProductCategories();
 }catch(e){console.error(e);$("categoryGrid").innerHTML='<div class="empty">Firebase connection/configuration check করুন।</div>';$("featuredProducts").innerHTML='<div class="empty">Firebase connection/configuration check করুন।</div>'}
}

function populateProductCategories(){
 $("pCategory").innerHTML=categories.length?categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join(""):'<option value="">আগে Category যোগ করুন</option>';
}
async function isAdmin(user){if(!user)return false;try{return (await getDoc(doc(db,"admins",user.uid))).exists()}catch(e){return false}}
async function showAdmin(){
 showPage("admin");$("adminLogin").classList.remove("hidden");$("adminApp").classList.add("hidden");
 const user=auth.currentUser;if(user&&await isAdmin(user)){showAdminApp()}
}
async function showAdminApp(){$("adminLogin").classList.add("hidden");$("adminApp").classList.remove("hidden");await Promise.all([loadAdminOrders(),loadAdminProducts(),loadAdminCategories()])}
async function loadAdminOrders(){
 const snap=await getDocs(collection(db,"orders"));let rows=snap.docs.map(d=>({id:d.id,...d.data()}));rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 $("adminOrdersList").innerHTML=rows.length?`<div style="overflow:auto"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Location</th><th>Total</th><th>Status</th></tr></thead><tbody>${rows.map(o=>`<tr><td><b>${esc(o.id)}</b><div class="order-mini">${esc(o.trackingCode||"")}</div></td><td>${esc(o.customerName)}<br>${esc(o.phone)}</td><td>${esc(o.division)}, ${esc(o.district)}<br>${esc(o.thana)}</td><td>${money(o.total)}</td><td><select class="status-select" data-status-order="${esc(o.id)}">${statuses.map(s=>`<option value="${s}" ${o.status===s?"selected":""}>${statusBn[s]}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">No orders yet.</div>';
 document.querySelectorAll("[data-status-order]").forEach(s=>s.onchange=()=>updateOrderStatus(s.dataset.statusOrder,s.value));
}
async function updateOrderStatus(id,status){
 try{await updateDoc(doc(db,"orders",id),{status,updatedAt:serverTimestamp()});const snap=await getDoc(doc(db,"orders",id));const o=snap.data();if(o.trackingCode)await updateDoc(doc(db,"orderTracking",o.trackingCode),{status,updatedAt:serverTimestamp()});toast("Order status updated");await loadAdminOrders()}catch(e){console.error(e);toast("Status update failed")}
}
async function loadAdminCategories(){
 const snap=await getDocs(collection(db,"categories"));categories=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
 $("adminCategoriesList").innerHTML=categories.length?categories.map(c=>`<div class="admin-card"><img src="${esc(c.imageUrl||fallbackImage)}" onerror="this.src='${fallbackImage}'"><div class="grow"><b>${esc(c.name)}</b><div class="order-mini">${esc(c.id)}</div></div><div class="admin-actions"><button data-edit-cat="${esc(c.id)}">Edit</button><button class="danger" data-del-cat="${esc(c.id)}">Delete</button></div></div>`).join(""):'<div class="empty">No categories. Add your first category.</div>';
 document.querySelectorAll("[data-edit-cat]").forEach(b=>b.onclick=()=>editCategory(b.dataset.editCat));document.querySelectorAll("[data-del-cat]").forEach(b=>b.onclick=()=>deleteCategory(b.dataset.delCat));
 renderHome();renderDrawerCategories();populateProductCategories();
}
async function loadAdminProducts(){
 const snap=await getDocs(collection(db,"products"));products=snap.docs.map(d=>({id:d.id,...d.data()}));$("adminProductsList").innerHTML=products.length?products.map(p=>`<div class="admin-card"><img src="${esc(p.imageUrl||fallbackImage)}" onerror="this.src='${fallbackImage}'"><div class="grow"><b>${esc(p.name)}</b><div>${money(p.price)} • ${esc(p.category||"No category")}</div></div><div class="admin-actions"><button data-edit-product="${esc(p.id)}">Edit</button><button class="danger" data-del-product="${esc(p.id)}">Delete</button></div></div>`).join(""):'<div class="empty">No products. Add your first product.</div>';
 document.querySelectorAll("[data-edit-product]").forEach(b=>b.onclick=()=>editProduct(b.dataset.editProduct));document.querySelectorAll("[data-del-product]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delProduct));
 renderHome();renderProducts();
}
function editCategory(id){const c=categories.find(x=>x.id===id);if(!c)return;$("categoryId").value=c.id;$("categoryName").value=c.name||"";$("categoryImage").value=c.imageUrl||"";openModal("categoryModal")}
async function deleteCategory(id){if(!confirm("Delete this category?"))return;try{await deleteDoc(doc(db,"categories",id));toast("Category deleted");await loadPublicData();if(auth.currentUser&&await isAdmin(auth.currentUser))await loadAdminCategories()}catch(e){toast("Delete failed")}}
function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;$("productId").value=p.id;$("pName").value=p.name||"";$("pCategory").value=p.category||"";$("pPrice").value=p.price||0;$("pOldPrice").value=p.oldPrice||"";$("pImage").value=p.imageUrl||"";$("pSizes").value=(p.sizes||[]).join(",");$("pDescription").value=p.description||"";$("productModalTitle").textContent="Edit Product";openModal("productModal")}
async function deleteProduct(id){if(!confirm("Delete this product?"))return;try{await deleteDoc(doc(db,"products",id));toast("Product deleted");await loadPublicData();if(auth.currentUser&&await isAdmin(auth.currentUser))await loadAdminProducts()}catch(e){toast("Delete failed")}}

$("menuBtn").onclick=()=>{$("sideMenu").classList.add("open");$("overlay").classList.add("show")};$("closeMenu").onclick=closeDrawer;$("overlay").onclick=closeDrawer;
$("homeBtn").onclick=()=>showPage("home");$("cartBtn").onclick=()=>showPage("cart");$("checkoutBtn").onclick=()=>cart.length?showPage("checkout"):toast("কার্টে কোনো পণ্য নেই");
$("searchBtn").onclick=()=>{openModal("searchModal");$("searchInput").focus()};$("closeSearch").onclick=()=>closeModal("searchModal");
$("zoomBtn").onclick=()=>openModal("zoomModal");$("closeZoom").onclick=()=>closeModal("zoomModal");
$("minusQty").onclick=()=>{$("qtyInput").value=Math.max(1,Number($("qtyInput").value)-1)};$("plusQty").onclick=()=>{$("qtyInput").value=Math.min(10,Number($("qtyInput").value)+1)};
$("addToCart").onclick=()=>addSelected(false);$("buyNow").onclick=()=>addSelected(true);
$("clearFilter").onclick=()=>{currentFilter="All";renderProducts()};$("deliveryZone").onchange=renderCheckout;$("orderForm").onsubmit=placeOrder;
$("trackOrderBtn").onclick=renderHistory;
$("searchInput").oninput=()=>{const q=$("searchInput").value.toLowerCase().trim();const m=products.filter(p=>(p.name||"").toLowerCase().includes(q));$("searchResults").innerHTML=m.map(p=>`<div class="search-result" data-search-product="${esc(p.id)}"><img src="${esc(p.imageUrl||fallbackImage)}"><div><h4>${esc(p.name)}</h4><strong>${money(p.price)}</strong></div></div>`).join("")||"<p>No product found.</p>"};
$("searchResults").onclick=e=>{const x=e.target.closest("[data-search-product]");if(x){closeModal("searchModal");openDetail(x.dataset.searchProduct)}};

document.addEventListener("click",e=>{
 const page=e.target.closest("[data-page]");if(page){e.preventDefault();closeDrawer();showPage(page.dataset.page)}
 const cat=e.target.closest("[data-category]");if(cat){currentFilter=cat.dataset.category;closeDrawer();renderProducts();showPage("products")}
 const cm=e.target.closest("[data-close-modal]");if(cm)closeModal(cm.dataset.closeModal)
});
$("adminMenuBtn").onclick=async()=>{closeDrawer();await showAdmin()};
$("adminLoginBtn").onclick=async()=>{const em=$("adminEmail").value.trim(),pw=$("adminPassword").value;$("adminError").textContent="";try{await signInWithEmailAndPassword(auth,em,pw);if(await isAdmin(auth.currentUser))showAdminApp();else{await signOut(auth);$("adminError").textContent="এই account admin হিসেবে অনুমোদিত নয়। Firebase Console-এ admins/{UID} document তৈরি করুন।"}}catch(e){$("adminError").textContent="Login failed: "+e.message}};
$("adminLogout").onclick=()=>signOut(auth);
document.querySelectorAll(".admin-tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".admin-section").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("admin"+b.dataset.adminTab.charAt(0).toUpperCase()+b.dataset.adminTab.slice(1)).classList.add("active")});
$("refreshOrders").onclick=loadAdminOrders;
$("newCategoryBtn").onclick=()=>{$("categoryForm").reset();$("categoryId").value="";openModal("categoryModal")};
$("newProductBtn").onclick=()=>{$("productForm").reset();$("productId").value="";$("productModalTitle").textContent="Add Product";populateProductCategories();openModal("productModal")};
$("categoryForm").onsubmit=async e=>{e.preventDefault();const id=$("categoryId").value,name=$("categoryName").value.trim(),imageUrl=$("categoryImage").value.trim();try{if(id)await updateDoc(doc(db,"categories",id),{name,imageUrl,updatedAt:serverTimestamp()});else await addDoc(collection(db,"categories"),{name,imageUrl,createdAt:serverTimestamp()});closeModal("categoryModal");toast("Category saved");await loadAdminCategories()}catch(err){console.error(err);toast("Category save failed")}};
$("productForm").onsubmit=async e=>{e.preventDefault();const id=$("productId").value,data={name:$("pName").value.trim(),category:$("pCategory").value,price:Number($("pPrice").value),oldPrice:Number($("pOldPrice").value)||0,imageUrl:$("pImage").value.trim(),sizes:$("pSizes").value.split(",").map(x=>x.trim()).filter(Boolean),description:$("pDescription").value.trim(),updatedAt:serverTimestamp()};try{if(!data.category){toast("আগে category যোগ করুন");return}if(id)await updateDoc(doc(db,"products",id),data);else{data.createdAt=serverTimestamp();await addDoc(collection(db,"products"),data)}closeModal("productModal");toast("Product saved");await loadAdminProducts()}catch(err){console.error(err);toast("Product save failed")}};

document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
onAuthStateChanged(auth,async user=>{if(user&&await isAdmin(user)&&$("adminPage").classList.contains("active"))showAdminApp()});
initLocation();updateCartCount();renderCart();renderCheckout();loadPublicData();
