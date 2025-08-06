import { useLocation } from "wouter";

export function useNavigate() {
  const [, setLocation] = useLocation();

  const navigate = (path: string) => {
    console.log('useNavigate called with path:', path);
    console.log('Current location before navigation:', window.location.href);
    setLocation(path);
    console.log('setLocation called, new location should be:', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return navigate;
}