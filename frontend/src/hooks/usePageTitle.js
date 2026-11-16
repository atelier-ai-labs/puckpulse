import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { canonicalFor, titleFor } from "../seo/site.js";

// Sets document.title and the <link rel="canonical"> tag from the current route
// (see seo/site.js titleFor and canonicalFor). index.html ships no canonical tag,
// so this is the only one: Google reads it after running the page's JavaScript.
export default function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = titleFor(pathname);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalFor(pathname);
  }, [pathname]);
}
