import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProblemSection from "./components/ProblemSection";
import HowItWorksSection from "./components/HowItWorksSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </>
  );
}
