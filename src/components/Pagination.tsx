import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRef } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    // Scroll to the top of the content area to prevent layout shift issues
    const scrollToContentTop = () => {
      // Try to find the content area (beach cards container) to scroll to
      const contentElement =
        contentRef.current?.closest("main") ||
        document.querySelector("main") ||
        document.querySelector("[data-content-area]") ||
        document.body;

      if (contentElement) {
        const rect = contentElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - 20; // 20px offset for breathing room
        window.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
    };

    // Update the page
    onPageChange(page);

    // Scroll to content top after a brief delay to ensure content has rendered
    requestAnimationFrame(() => {
      scrollToContentTop();
    });
  };

  const getPageNumbers = () => {
    const pages = [];
    const showPages = isMobile ? 3 : 5; // Show 3 pages on mobile, 5 on desktop

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    // Adjust startPage if we're near the end
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div ref={contentRef} className="flex items-center justify-center gap-1 sm:gap-2 mt-8 px-2">
      {/* Previous Button */}
      <div className="w-16 sm:w-20 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          className={`flex items-center gap-1 text-xs sm:text-sm transition-all duration-300 ease-out ${
            currentPage > 1
              ? "opacity-100 visible translate-x-0 scale-100"
              : "opacity-0 invisible -translate-x-2 scale-95 pointer-events-none"
          }`}
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>
      </div>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {/* First page if not in range */}
        {pageNumbers[0] > 1 && (
          <>
            <Button
              variant={1 === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(1)}
              className="w-8 sm:w-10 text-xs sm:text-sm"
            >
              1
            </Button>
            {pageNumbers[0] > 2 && (
              <span className="px-1 sm:px-2 text-muted-foreground text-xs sm:text-sm">...</span>
            )}
          </>
        )}

        {/* Page number buttons */}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className="w-8 sm:w-10 text-xs sm:text-sm"
          >
            {page}
          </Button>
        ))}

        {/* Last page if not in range */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-1 sm:px-2 text-muted-foreground text-xs sm:text-sm">...</span>
            )}
            <Button
              variant={totalPages === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="w-8 sm:w-10 text-xs sm:text-sm"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      {/* Next Button */}
      <div className="w-16 sm:w-20 flex justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          className={`flex items-center gap-1 text-xs sm:text-sm transition-all duration-300 ease-out ${
            currentPage < totalPages
              ? "opacity-100 visible translate-x-0 scale-100"
              : "opacity-0 invisible translate-x-2 scale-95 pointer-events-none"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
