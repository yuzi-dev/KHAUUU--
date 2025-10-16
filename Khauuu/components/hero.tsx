import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter } from "lucide-react";
const heroFood = "/assets/hero-food.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroFood})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6">
            Discover Nepal's
            <span className="block text-nepali-gold">Finest Foods</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            From street-side momos to traditional dal bhat, explore authentic Nepali cuisine 
            with reviews, ratings, and recommendations from locals.
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-warm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Search for restaurants, dishes, or cuisine..."
                    className="pl-10 h-12 text-lg border-0 bg-background focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Location"
                    className="pl-10 h-12 border-0 bg-background focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button variant="hero" size="lg" className="h-12 text-lg">
                  <Search className="w-5 h-5" />
                  Search
                </Button>
              </div>
              
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <Button variant="warm" size="sm">
                  <Filter className="w-4 h-4" />
                  Vegetarian
                </Button>
                <Button variant="warm" size="sm">Budget Friendly</Button>
                <Button variant="warm" size="sm">Nearby</Button>
                <Button variant="warm" size="sm">Highly Rated</Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 max-w-4xl mx-auto">
            <div className="text-center animate-bounce-gentle">
              <div className="text-3xl font-bold text-nepali-gold">500+</div>
              <div className="text-primary-foreground/80">Restaurants</div>
            </div>
            <div className="text-center animate-bounce-gentle" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-nepali-gold">2000+</div>
              <div className="text-primary-foreground/80">Reviews</div>
            </div>
            <div className="text-center animate-bounce-gentle" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl font-bold text-nepali-gold">50+</div>
              <div className="text-primary-foreground/80">Cuisines</div>
            </div>
            <div className="text-center animate-bounce-gentle" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl font-bold text-nepali-gold">10K+</div>
              <div className="text-primary-foreground/80">Happy Foodies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;