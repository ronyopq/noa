import { redirect } from 'next/navigation'
import { primaryRestaurant } from '@/db/store'

export default function HomePage() {
  const restaurant = primaryRestaurant()
  if (restaurant) {
    redirect(`/menu/${encodeURIComponent(restaurant.slug)}`)
  }
  return (
    <main className="menu-topbar" style={{ padding: '16px' }}>
      <h1 style={{ margin: '8px 0 16px', fontFamily: 'var(--font-hind)', fontSize: '1.5rem' }}>
        রেস্টুরেন্ট এখনো সেটআপ করা হয়নি
      </h1>
      <p>রেস্টুরেন্ট যোগ করার পর <a href="/admin/login">অ্যাডমিন লগইনে</a> গিয়ে সেটআপ করুন।</p>
      <p style={{ fontSize: '0.8rem' }}>
        <a href="/menu/main">সাধারণ মেনু দেখুন</a>
      </p>
    </main>
  )
}
