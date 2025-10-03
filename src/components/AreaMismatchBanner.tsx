import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AreaMismatchBannerProps {
  searchedPlace: string;
  currentArea: string;
  searchUrl: string;
}

export function AreaMismatchBanner({ searchedPlace, currentArea, searchUrl }: AreaMismatchBannerProps) {
  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="ml-2">
        You searched for <strong>{searchedPlace}</strong>, but you're viewing <strong>{currentArea}</strong>.{' '}
        <Link 
          to={searchUrl} 
          className="font-medium underline underline-offset-4 hover:text-primary"
        >
          Go to {searchedPlace} results?
        </Link>
      </AlertDescription>
    </Alert>
  );
}
