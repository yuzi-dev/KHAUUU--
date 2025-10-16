import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-earth-brown text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-nepali-gold">Khauuu</div>
              <div className="text-sm text-primary-foreground/80">खाऊ</div>
            </div>
            <p className="text-primary-foreground/80">
              Discover Nepal's finest foods and connect with local culinary experiences.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-nepali-gold">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-nepali-gold">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-nepali-gold">
                <Twitter className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Discover</a></li>
              <li><a href="/restaurants" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Restaurants</a></li>
              <li><a href="/reviews" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Reviews</a></li>
              <li><a href="/offers" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Offers</a></li>
              <li><a href="/favorites" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Favorites</a></li>
              <li><a href="/profile" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Profile</a></li>
            </ul>
          </div>

          {/* For Restaurants */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Restaurants</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Partner with Us</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Owner Dashboard</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Marketing Tools</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-nepali-gold transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-nepali-gold" />
                <span className="text-primary-foreground/80">Kathmandu, Nepal</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-nepali-gold" />
                <span className="text-primary-foreground/80">+977-1-4444444</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-nepali-gold" />
                <span className="text-primary-foreground/80">hello@khauuu.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/60">
            © 2024 Khauuu. All rights reserved. Made with ❤️ in Nepal.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;