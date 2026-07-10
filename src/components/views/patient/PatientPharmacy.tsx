/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Package, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Eye, 
  MapPin, 
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

interface PatientPharmacyProps {
  userEmail: string;
  addNotification: (title: string, message: string) => void;
  walletBalance: number;
  deductFromWallet: (amount: number, reason: string) => boolean;
}

interface MedicineItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  prescriptionRequired: boolean;
  dosage?: string;
}

interface CartItem {
  medicine: MedicineItem;
  quantity: number;
}

export default function PatientPharmacy({ userEmail, addNotification, walletBalance, deductFromWallet }: PatientPharmacyProps) {
  // 1. Medicines and categories State
  const [medicines, setMedicines] = React.useState<MedicineItem[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  // 2. Shopping Cart state
  const [cart, setCart] = React.useState<CartItem[]>([]);
  
  // 3. Prescription Upload State
  const [uploadedPrescription, setUploadedPrescription] = React.useState<{ name: string; url: string } | null>(null);

  // 4. Order tracking & History
  const [orders, setOrders] = React.useState<any[]>([]);

  // 5. Checkout Address details
  const [shippingAddress, setShippingAddress] = React.useState({
    name: 'Aarav Mehta',
    phone: '9876543210',
    addressLine: 'A-402 Bandra West, Link Road',
    city: 'Mumbai',
    pincode: '400050'
  });

  // Load medicines & orders
  React.useEffect(() => {
    const savedMeds = localStorage.getItem('ds_medicines');
    if (savedMeds) {
      setMedicines(JSON.parse(savedMeds));
    } else {
      // Seed default list matching pharmacy expectations
      const defaults: MedicineItem[] = [
        { id: 'm-1', name: 'Paracetamol 650mg (Dolo)', category: 'Analgesics', price: 42, stock: 240, description: 'Fever reducer and pain reliever.', prescriptionRequired: false, dosage: '1 tablet twice a day' },
        { id: 'm-2', name: 'Amoxicillin 500mg', category: 'Antibiotics', price: 120, stock: 95, description: 'Broad-spectrum antibiotic for bacterial infections.', prescriptionRequired: true, dosage: '1 tablet thrice a day' },
        { id: 'm-3', name: 'Atorvastatin 10mg (Lipitor)', category: 'Cardiovascular', price: 185, stock: 150, description: 'Cholesterol-lowering statin medication.', prescriptionRequired: true, dosage: '1 tablet at bedtime' },
        { id: 'm-4', name: 'Metformin 500mg (Glycomet)', category: 'Antidiabetic', price: 55, stock: 320, description: 'Oral antidiabetic for blood sugar regulation.', prescriptionRequired: true, dosage: '1 tablet with dinner' },
        { id: 'm-5', name: 'Cetirizine 10mg', category: 'Antihistamines', price: 35, stock: 400, description: 'Non-drowsy 24-hour allergy relief tablets.', prescriptionRequired: false, dosage: '1 tablet once daily' }
      ];
      localStorage.setItem('ds_medicines', JSON.stringify(defaults));
      setMedicines(defaults);
    }

    const savedOrders = localStorage.getItem('ds_medicine_orders');
    if (savedOrders) {
      const all = JSON.parse(savedOrders);
      setOrders(all.filter((o: any) => o.patientEmail === userEmail));
    } else {
      const defaultOrders = [
        {
          id: 'PHARM-ORD-4819',
          patientEmail: userEmail,
          items: [
            { medicineName: 'Paracetamol 650mg (Dolo)', price: 42, quantity: 2 }
          ],
          total: 84,
          status: 'Delivered',
          date: '2026-07-03',
          address: 'A-402 Bandra West, Link Road, Mumbai - 400050',
          prescriptionRequired: false
        }
      ];
      localStorage.setItem('ds_medicine_orders', JSON.stringify(defaultOrders));
      setOrders(defaultOrders.filter((o: any) => o.patientEmail === userEmail));
    }
  }, [userEmail]);

  // Derive categories list dynamically
  React.useEffect(() => {
    if (medicines.length > 0) {
      const cats = Array.from(new Set(medicines.map(m => m.category)));
      setCategories(['All', ...cats]);
    }
  }, [medicines]);

  // Filter medicines based on search and category
  const filteredMeds = React.useMemo(() => {
    return medicines.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, selectedCategory]);

  // Cart Management
  const handleAddToCart = (med: MedicineItem) => {
    if (med.stock <= 0) {
      alert('This medicine is currently out of stock.');
      return;
    }
    const existing = cart.find(item => item.medicine.id === med.id);
    if (existing) {
      if (existing.quantity >= med.stock) {
        alert('Cannot add more. Limit reached based on available pharmacy inventory stock.');
        return;
      }
      setCart(cart.map(item => item.medicine.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { medicine: med, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (id: string, q: number) => {
    if (q <= 0) {
      setCart(cart.filter(item => item.medicine.id !== id));
      return;
    }
    const item = cart.find(i => i.medicine.id === id);
    if (item && q > item.medicine.stock) {
      alert('Selected quantity exceeds available store stock.');
      return;
    }
    setCart(cart.map(item => item.medicine.id === id ? { ...item, quantity: q } : item));
  };

  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.medicine.id !== id));
  };

  // Prescription Upload Mock Helper (Loads base64 representation of file)
  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPrescription({
        name: file.name,
        url: reader.result as string
      });
      alert('✓ Prescription uploaded successfully. It will be verified during pharmacist processing!');
    };
    reader.readAsDataURL(file);
  };

  // Calculate Cart Summary
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
  const deliveryFee = cartSubtotal > 500 ? 0 : 40;
  const cartTotal = cartSubtotal + deliveryFee;

  const cartRequiresPrescription = cart.some(item => item.medicine.prescriptionRequired);

  // Checkout Handler
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (cartRequiresPrescription && !uploadedPrescription) {
      alert('❌ Standard checkout blocked! One or more selected drugs require an uploaded prescription copy.');
      return;
    }

    // Try paying with wallet
    const success = deductFromWallet(cartTotal, `Pharmacy Order Purchase`);
    if (!success) {
      alert('❌ Insufficient balance in your Spark Wallet to complete this medicine purchase.');
      return;
    }

    // Deduct stock in global list
    const savedMeds = localStorage.getItem('ds_medicines');
    const medList: MedicineItem[] = savedMeds ? JSON.parse(savedMeds) : [];
    const updatedMedList = medList.map(m => {
      const cartItem = cart.find(ci => ci.medicine.id === m.id);
      if (cartItem) {
        return { ...m, stock: Math.max(0, m.stock - cartItem.quantity) };
      }
      return m;
    });
    localStorage.setItem('ds_medicines', JSON.stringify(updatedMedList));
    setMedicines(updatedMedList);

    // Create Order Record
    const newOrder = {
      id: `PHARM-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      patientEmail: userEmail,
      items: cart.map(item => ({
        medicineName: item.medicine.name,
        price: item.medicine.price,
        quantity: item.quantity
      })),
      total: cartTotal,
      status: 'Placed',
      date: new Date().toISOString().split('T')[0],
      address: `${shippingAddress.addressLine}, ${shippingAddress.city} - ${shippingAddress.pincode}`,
      phone: shippingAddress.phone,
      prescriptionUrl: uploadedPrescription?.url || null,
      prescriptionName: uploadedPrescription?.name || null
    };

    // Save to global order ledger
    const savedOrders = localStorage.getItem('ds_medicine_orders');
    const orderList = savedOrders ? JSON.parse(savedOrders) : [];
    const updatedOrders = [newOrder, ...orderList];
    localStorage.setItem('ds_medicine_orders', JSON.stringify(updatedOrders));

    // Update local list & Clear cart
    setOrders(updatedOrders.filter((o: any) => o.patientEmail === userEmail));
    setCart([]);
    setUploadedPrescription(null);

    addNotification('Order Placed', `Medicine order successfully created. Order ID: ${newOrder.id}`);
    alert(`✓ Medicine Order Placed Successfully!\nID: ${newOrder.id}\nPaid ₹${cartTotal} from your Spark Wallet.`);
  };

  // Cancel order (only eligible if "Placed" or "Pending")
  const handleCancelOrder = (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this medicine order?')) return;

    const savedOrders = localStorage.getItem('ds_medicine_orders');
    const orderList = savedOrders ? JSON.parse(savedOrders) : [];

    const updated = orderList.map((o: any) => {
      if (o.id === orderId) {
        return { ...o, status: 'Cancelled' };
      }
      return o;
    });

    localStorage.setItem('ds_medicine_orders', JSON.stringify(updated));
    setOrders(updated.filter((o: any) => o.patientEmail === userEmail));

    // Add back the money to wallet
    const cancelledOrder = orderList.find((o: any) => o.id === orderId);
    if (cancelledOrder) {
      // Refund cash to localstorage wallet
      const savedBalance = localStorage.getItem(`ds_wallet_balance_${userEmail}`);
      const oldBal = savedBalance ? parseFloat(savedBalance) : walletBalance;
      const newBal = oldBal + cancelledOrder.total;
      localStorage.setItem(`ds_wallet_balance_${userEmail}`, newBal.toString());
      
      // Force page-level refresh if integrated
      addNotification('Order Refunded', `Order ${orderId} was cancelled. ₹${cancelledOrder.total} refunded back to your Spark Wallet.`);
      alert(`✓ Order cancelled. ₹${cancelledOrder.total} successfully refunded back to your Spark Wallet!`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider">💊 Digital Pharmacy & Medicines</h3>
        <p className="text-xs text-gray-400">Browse categories, check prescription prerequisites, add meds to cart, and track orders live.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Product browsing, Search & Categories */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs space-y-4">
            
            {/* Search, Filter Category */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-grow w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search over-the-counter medicines, capsules, or syrups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#D1E5E5] rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 shrink-0 w-full sm:w-40"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Medicines List catalog */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredMeds.map((med) => (
                <div key={med.id} className="py-4 flex justify-between items-start gap-4 first:pt-0 last:pb-0 text-xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-[#1A2B3C]">{med.name}</h4>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">({med.category})</span>
                      {med.prescriptionRequired && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[8px] font-black uppercase tracking-wider rounded">
                          ℞ Rx Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 font-medium mt-1">{med.description}</p>
                    {med.dosage && (
                      <span className="text-[10px] text-indigo-700 font-mono font-semibold block mt-1">✓ Recommended: {med.dosage}</span>
                    )}
                    <span className={`inline-block mt-2 font-bold ${med.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {med.stock > 0 ? `In Stock (${med.stock} units)` : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block font-black text-[#1A2B3C] text-sm">₹{med.price}</span>
                    <button
                      disabled={med.stock <= 0}
                      onClick={() => handleAddToCart(med)}
                      className="mt-3 px-3 py-1.5 bg-[#0A6E6E] disabled:bg-slate-200 hover:bg-[#075353] text-white text-[10px] font-black rounded-lg cursor-pointer transition-all shadow-3xs flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3 h-3" /> Add To Cart
                    </button>
                  </div>
                </div>
              ))}

              {filteredMeds.length === 0 && (
                <div className="text-center py-12 text-gray-400 font-bold bg-slate-50 rounded-2xl">
                  No medicines found matching filters.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right: Shopping Cart, checkout, prescription uploads */}
        <div className="space-y-6">
          
          <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Shopping Cart</span>
              <ShoppingCart className="w-4 h-4 text-gray-400" />
            </h4>

            {cart.length > 0 ? (
              <div className="space-y-4 mt-4">
                
                {/* Cart list */}
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.medicine.id} className="py-2.5 flex justify-between items-center text-xs first:pt-0">
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-[#1A2B3C] truncate">{item.medicine.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">₹{item.medicine.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.medicine.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 text-xs font-black cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 font-bold text-[10px] bg-white">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.medicine.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 text-xs font-black cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.medicine.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prescription Required Alert & Upload Block */}
                {cartRequiresPrescription && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2 text-xs">
                    <div className="flex gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-red-900 uppercase text-[9px] tracking-wide">Prescription Mandatory</p>
                        <p className="text-red-800/80 leading-snug font-semibold text-[10px]">
                          This order contains drugs requiring doctor authorization. Please upload scan to checkout.
                        </p>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-red-200 bg-white/60 p-3 rounded-lg text-center relative hover:bg-white transition-all">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handlePrescriptionUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {uploadedPrescription ? (
                        <div className="text-emerald-700 font-semibold text-[10px] flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{uploadedPrescription.name.slice(0, 20)}...</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-500 font-bold flex flex-col items-center gap-1">
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span>Click to Upload Prescription Scan</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtotals bento */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-gray-600">
                  <div className="flex justify-between">
                    <span>Medicines Subtotal:</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery fee:</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 font-black text-slate-800">
                    <span>Total Bill:</span>
                    <span className="text-[#0A6E6E] text-xs">₹{cartTotal}</span>
                  </div>
                </div>

                {/* Delivery details form */}
                <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t border-slate-50">
                  <div className="space-y-1 text-[10px]">
                    <label className="font-bold text-gray-400 block uppercase">Home Delivery Address</label>
                    <textarea
                      value={shippingAddress.addressLine}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-400 block uppercase">Phone Number</label>
                      <input
                        type="text"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-400 block uppercase">Pincode</label>
                      <input
                        type="text"
                        value={shippingAddress.pincode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0A6E6E] hover:bg-[#075353] text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-3xs"
                  >
                    Deduct & Pay ₹{cartTotal}
                  </button>
                </form>

              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                Your medicine shopping cart is currently empty.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Orders ledger */}
      <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-1">Your Medicine Order History & Logs</h4>
        <p className="text-xs text-gray-400 mb-4">Review packing stages, tracking carrier delivery, and request cancellation on eligible orders.</p>

        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-[#0A6E6E]">{o.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                    o.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    o.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {o.status}
                  </span>
                  <span className="text-gray-400 font-bold">{o.date}</span>
                </div>
                
                {/* Items List inside description */}
                <div className="mt-2 text-slate-700 font-semibold">
                  {o.items.map((i: any, idx: number) => (
                    <span key={idx} className="inline-block mr-3">
                      💊 {i.medicineName} (Qty: {i.quantity})
                    </span>
                  ))}
                </div>

                <p className="text-gray-400 font-medium mt-1">Delivery Destination: {o.address} | Phone: {o.phone || shippingAddress.phone}</p>
                {o.prescriptionName && (
                  <p className="text-indigo-700 font-mono text-[9px] mt-0.5">✓ Uploaded Rx document: {o.prescriptionName}</p>
                )}
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <span className="font-black text-[#1A2B3C] text-sm">Total: ₹{o.total}</span>
                {o.status === 'Placed' && (
                  <button
                    onClick={() => handleCancelOrder(o.id)}
                    className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[9px] font-black cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-400 font-semibold bg-slate-50 rounded-xl">
              No medicine purchases tracked on this profile yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
