import { Link } from 'react-router';
import { cn } from '../../lib/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  basePath: string;
  searchParams?: URLSearchParams;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  basePath,
  searchParams,
  className = ''
}: PaginationProps) {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  
  // Helper function to build URL with existing search params
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const queryString = params.toString();
    return `${basePath}${queryString ? `?${queryString}` : ''}`;
  };

  // Calculate which page numbers to show
  const getVisiblePages = () => {
    const visiblePages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      // Always show first page
      visiblePages.push(1);
      
      if (currentPage <= 4) {
        // Current page is near the beginning
        for (let i = 2; i <= 5; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('ellipsis');
        visiblePages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Current page is near the end
        visiblePages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        // Current page is in the middle
        visiblePages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('ellipsis');
        visiblePages.push(totalPages);
      }
    }
    
    return visiblePages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Shared chip geometry. min-h-11 meets the 44px touch target; these were
  // ~34px tall before. No `!important` needed now that cn() resolves conflicts.
  const chip =
    'inline-flex items-center justify-center px-3 py-2 min-h-11 text-sm rounded-control border transition-colors';
  const chipEnabled = 'text-gray-900 bg-white border-gray-300 hover:bg-gray-50';
  const chipDisabled = 'text-gray-400 bg-gray-100 border-gray-300 cursor-default';

  if (totalPages <= 1) {
    return (
      <div className={cn('text-center text-sm text-gray-600', className)}>
        Showing {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Pagination Controls. flex-wrap is required: at 390px a "Previous"
          button, up to seven page chips and a "Next" button overflowed the
          viewport horizontally. */}
      <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
        {/* Previous Page */}
        {hasPrevPage ? (
          <Link 
            to={buildUrl(currentPage - 1)}
            className={cn(chip, chipEnabled)}
            aria-label="Previous page"
          >
            ← Previous
          </Link>
        ) : (
          <span className={cn(chip, chipDisabled)} aria-disabled="true">
            ← Previous
          </span>
        )}

        {/* Page Numbers */}
        <div className="flex flex-wrap justify-center gap-1">
          {getVisiblePages().map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-gray-400">
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;
            
            return isCurrentPage ? (
              <span
                key={page}
                className={cn(chip, 'bg-brand-600 text-white border-brand-600 font-medium')}
                aria-current="page"
              >
                {page}
              </span>
            ) : (
              <Link
                key={page}
                to={buildUrl(page)}
                className={cn(chip, chipEnabled)}
                aria-label={`Page ${page}`}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* Next Page */}
        {hasNextPage ? (
          <Link 
            to={buildUrl(currentPage + 1)}
            className={cn(chip, chipEnabled)}
            aria-label="Next page"
          >
            Next →
          </Link>
        ) : (
          <span className={cn(chip, chipDisabled)} aria-disabled="true">
            Next →
          </span>
        )}
      </nav>

      {/* Pagination Info */}
      <div className="text-center text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
}