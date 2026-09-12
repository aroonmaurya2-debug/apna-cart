export function registerSellerEarningsRoutes({ app, getSession, clean, productsCollection, sellersCollection }) {
  app.get('/api/sellers/earnings', async (request, response) => {
    const session=getSession(request); if(!session)return response.status(401).json({message:'Seller login required.'})
    try {
      const sellers=await sellersCollection.where('email','==',session.contact).limit(1).get(); if(sellers.empty)return response.status(403).json({message:'Register as a seller first.'})
      const seller=sellers.docs[0].data(); const sellerId=sellers.docs[0].id
      const snapshot=await productsCollection.firestore.collection('orders').orderBy('createdAt','desc').get()
      let grossSales=0, sellerEarnings=0, commission=0, deliveredOrders=0, otherOrders=0
      snapshot.docs.forEach(doc=>{const order=doc.data(); const items=Array.isArray(order.items)?order.items.filter(item=>String(item.sellerId||'')===String(sellerId)):[]; if(!items.length)return; const gross=items.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||1),0); if(order.status==='Delivered'){deliveredOrders++;grossSales+=gross;const rate=Number(seller.commissionRate||10);const fee=gross*rate/100;commission+=fee;sellerEarnings+=gross-fee}else otherOrders++})
      return response.json({earnings:{grossSales, sellerEarnings, commission, deliveredOrders, otherOrders, commissionRate:Number(seller.commissionRate||10)}})
    } catch(error){console.error('Seller earnings failed:',error);return response.status(500).json({message:'Seller earnings could not be loaded.'})}
  })
}
