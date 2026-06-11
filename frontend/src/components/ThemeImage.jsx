import { useTheme } from "../context/ThemeContext";

const DARK_SRC = {
  signup: "/images/dark/signup-how-it-works.png",
  login: "/images/dark/login.png",
  forgot: "/images/dark/forgot-password.png",
  hero: "/images/dark/hero.png",
  howItWorks: "/images/dark/signup-how-it-works.png",
};

const ThemeImage = ({ name, lightSrc, alt, className }) => {
  const { isDark } = useTheme();
  const src = isDark && DARK_SRC[name] ? DARK_SRC[name] : lightSrc;
  return <img src={src} alt={alt} className={className} />;
};

export default ThemeImage;
