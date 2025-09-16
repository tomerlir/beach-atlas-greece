import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8 text-center">
            About Greek Beaches
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              Welcome to the most comprehensive directory of Greek beaches. Our mission is to help you 
              discover the perfect beach for your next Greek adventure, from the famous beaches of 
              Santorini and Mykonos to hidden gems scattered across the Greek islands.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">What We Offer</h2>
            
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Detailed information about beaches across all Greek islands and mainland</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Smart filtering by amenities, organization level, parking, and Blue Flag certification</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Location-based search to find beaches near you</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>High-quality photos and detailed descriptions</span>
              </li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">Blue Flag Certification</h2>
            
            <p className="text-muted-foreground mb-6">
              Many beaches in our directory are Blue Flag certified, meaning they meet strict 
              international standards for water quality, environmental management, safety, and services. 
              Look for the Blue Flag badge on beach cards to find these premium destinations.
            </p>
            
            <h2 id="credits" className="text-2xl font-semibold text-foreground mb-4">Credits</h2>
            
            <p className="text-muted-foreground mb-6">
              Our beach data is carefully curated from multiple sources including official tourism boards, 
              local authorities, and verified visitor information. We strive to keep all information 
              accurate and up-to-date.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            
            <p className="text-muted-foreground">
              Have suggestions for beaches we should add? Found incorrect information? We'd love to 
              hear from you! Send us your feedback using the Feedback link in our navigation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;