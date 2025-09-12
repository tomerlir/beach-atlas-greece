import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers at most
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
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
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {/* First page if not in range */}
        {pageNumbers[0] > 1 && (
          <>
            <Button
              variant={1 === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(1)}
              className="w-10"
            >
              1
            </Button>
            {pageNumbers[0] > 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}

        {/* Page number buttons */}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="w-10"
          >
            {page}
          </Button>
        ))}

        {/* Last page if not in range */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
            <Button
              variant={totalPages === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="w-10"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;