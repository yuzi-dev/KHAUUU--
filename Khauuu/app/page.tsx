import Navbar from "@/components/layout/navbar";
import Hero from "@/components/hero";
import FeaturedSection from "@/features/restaurants/components/featured-section";
import PopularFoodsSection from "@/features/restaurants/components/popular-foods-section";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <PopularFoodsSection />
        <FeaturedSection />
      </main>
      <Footer />
    </div>
  );
}