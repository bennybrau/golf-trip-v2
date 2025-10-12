import { Link } from 'react-router';

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

  if (totalPages <= 1) {
    return (
      <div className={`text-center text-sm text-gray-600 ${className}`}>
        Showing {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Page */}
        {hasPrevPage ? (
          <Link 
            to={buildUrl(currentPage - 1)}
            className="px-3 py-2 text-sm !text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Previous
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm text-gray-400 border border-gray-300 rounded-md bg-gray-100">
            ← Previous
          </span>
        )}

        {/* Page Numbers */}
        <div className="flex gap-1">
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
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-md font-medium"
              >
                {page}
              </span>
            ) : (
              <Link
                key={page}
                to={buildUrl(page)}
                className="px-3 py-2 text-sm !text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
            className="px-3 py-2 text-sm !text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Next →
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm text-gray-400 border border-gray-300 rounded-md bg-gray-100">
            Next →
          </span>
        )}
      </div>

      {/* Pagination Info */}
      <div className="text-center text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
}