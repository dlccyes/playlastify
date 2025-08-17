import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TrackWithStats } from '../types';
import { sortTracks, searchTracks } from '../utils/playlistUtils';

interface TrackTableProps {
  tracks: TrackWithStats[];
  searchTerm: string;
  exactMatch: boolean;
  showScrobbles: boolean;
  className?: string;
}

type SortField = 'name' | 'artist' | 'daysSinceAdded' | 'scrobbles';
type SortOrder = 'asc' | 'desc';

const SortIcon: React.FC<{ field: SortField; currentField: SortField; sortOrder: SortOrder }> = ({ field, currentField, sortOrder }) => {
  if (field !== currentField) return null;
  return sortOrder === 'asc' ? (
    <ChevronUp className="w-4 h-4 inline ml-1" />
  ) : (
    <ChevronDown className="w-4 h-4 inline ml-1" />
  );
};

const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  searchTerm,
  exactMatch,
  showScrobbles,
  className = ''
}) => {
  const [sortField, setSortField] = useState<SortField>('daysSinceAdded');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedTracks = useMemo(() => {
    const filtered = searchTracks(tracks, searchTerm, exactMatch);
    return sortTracks(filtered, sortField, sortOrder);
  }, [tracks, searchTerm, exactMatch, sortField, sortOrder]);

  const totalScrobbles = useMemo(() => {
    if (!showScrobbles) return 0;
    return filteredAndSortedTracks.reduce((sum, track) => sum + (track.scrobbles || 0), 0);
  }, [filteredAndSortedTracks, showScrobbles]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };



  return (
    <div className={`${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <div className="text-pink-200 text-sm sm:text-base">
          {filteredAndSortedTracks.length} result{filteredAndSortedTracks.length !== 1 ? 's' : ''}
        </div>
        {showScrobbles && (
          <div className="text-pink-200 text-sm sm:text-base">
            {totalScrobbles} scrobbles
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-center text-white">
          <thead>
            <tr>
              <th 
                className="cursor-pointer select-none p-2 sm:p-3 hover:bg-white/10 text-xs sm:text-sm"
                onClick={() => handleSort('name')}
              >
                Title <SortIcon field="name" currentField={sortField} sortOrder={sortOrder} />
              </th>
              <th 
                className="cursor-pointer select-none p-2 sm:p-3 hover:bg-white/10 text-xs sm:text-sm"
                onClick={() => handleSort('artist')}
              >
                Artist <SortIcon field="artist" currentField={sortField} sortOrder={sortOrder} />
              </th>
              <th 
                className="cursor-pointer select-none p-2 sm:p-3 hover:bg-white/10 text-xs sm:text-sm"
                onClick={() => handleSort('daysSinceAdded')}
              >
                <span className="hidden sm:inline">Days Since Added</span>
                <span className="sm:hidden">Added</span>
                <SortIcon field="daysSinceAdded" currentField={sortField} sortOrder={sortOrder} />
              </th>
                              {showScrobbles && (
                <th 
                  className="cursor-pointer select-none p-2 sm:p-3 hover:bg-white/10 text-xs sm:text-sm"
                  onClick={() => handleSort('scrobbles')}
                >
                  <span className="hidden sm:inline">Scrobbles</span>
                  <span className="sm:hidden">Scrob</span>
                  <SortIcon field="scrobbles" currentField={sortField} sortOrder={sortOrder} />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTracks.map((track) => (
              <tr key={`${track.track.id}-${track.track.name}`} className="border-t border-white/20 hover:bg-white/5">
                <td className="p-2 sm:p-3 text-xs sm:text-sm">{track.track.name}</td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm">{track.track.artists.map(a => a.name).join(', ')}</td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm">{track.daysSinceAdded}</td>
                {showScrobbles && (
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">{track.scrobbles || 0}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredAndSortedTracks.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No results found
        </div>
      )}
      
      <div className="mt-4 text-xs sm:text-sm text-gray-400 text-center">
        Click any column title to sort (like you do in Spotify)
      </div>
    </div>
  );
};

export default TrackTable; 