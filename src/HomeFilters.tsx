import { useMemo, useState } from 'react'

type Product = { id: number; name: string; category: string; gender?: string; price: number; oldPrice: number; rating: number }

export const HOME_FILTER_CATEGORIES = ['All', '8PM Offer', 'Saree', 'Western Wear', 'Jewellery', 'Men', 'Kitchen', 'Kurtis & Dresses', 'Kids', 'Home', 'Beauty', 'Footwear', 'All Categories']
export const HOME_FILTER_GENDERS = ['All', 'Women', 'Men', 'Kids', 'Unisex']

export function useHomeFilters(products: Product[]) {
  const [category, setCategory] = useState('All')
  const [gender, setGender] = useState('All')
  const [sortBy, setSortBy] = useState('relevance')
  const productGender = (p: Product) => p.gender || (p.category === 'Men' || /\bmen'?s?\b/i.test(p.name) ? 'Men' : p.category === 'Kids' || /\bkids?\b/i.test(p.name) ? 'Kids' : p.category === 'All Categories' && /smartphone|headphones/i.test(p.name) ? 'Unisex' : 'Women')
  const filtered = useMemo(() => {
    const list = products.filter(p => (category === 'All' || p.category === category) && (gender === 'All' || productGender(p) === gender))
    return [...list].sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : sortBy === 'rating' ? b.rating - a.rating : sortBy === 'discount' ? ((b.oldPrice - b.price) / Math.max(b.oldPrice, 1)) - ((a.oldPrice - a.price) / Math.max(a.oldPrice, 1)) : 0)
  }, [products, category, gender, sortBy])
  return { category, setCategory, gender, setGender, sortBy, setSortBy, filtered }
}

export default function HomeFilters({ category, setCategory, gender, setGender, sortBy, setSortBy, onReset }: { category: string; setCategory: (v: string) => void; gender: string; setGender: (v: string) => void; sortBy: string; setSortBy: (v: string) => void; onReset?: () => void }) {
  return <section className="filter-row">
    <select aria-label="Sort products" value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="relevance">↕ Sort</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="rating">Top Rated</option><option value="discount">Best Discount</option></select>
    <select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}><option value="All">Category</option>{HOME_FILTER_CATEGORIES.filter(x => x !== 'All').map(x => <option key={x} value={x === 'All Categories' ? 'All' : x}>{x}</option>)}</select>
    <select aria-label="Gender" value={gender} onChange={e => setGender(e.target.value)}>{HOME_FILTER_GENDERS.map(x => <option key={x} value={x}>{x === 'All' ? 'Gender' : x}</option>)}</select>
    <select aria-label="Filters" defaultValue="all" onChange={e => { if (e.target.value === 'reset') { setCategory('All'); setGender('All'); setSortBy('relevance'); onReset?.() } }}><option value="all">≡ Filters</option><option value="reset">Reset All Filters</option></select>
  </section>
}
