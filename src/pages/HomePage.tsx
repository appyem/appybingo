import { Hero } from '../components/home/Hero';
import { ActiveGame } from '../components/home/ActiveGame';
import { HowItWorks } from '../components/home/HowItWorks';
import { UpcomingGame } from '../components/home/UpcomingGame';

export function HomePage() {
  return (
    <>
      <Hero />
      <ActiveGame />
      <HowItWorks />
      <UpcomingGame />
    </>
  );
}
