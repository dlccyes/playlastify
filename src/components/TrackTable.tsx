import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TrackWithStats } from '../types';
import { sortTracks, searchTracks } from '../utils/dataProcessing';
import { formatDuration } from '../utils/dataProcessing';

interface TrackTableProps {
  tracks: TrackWithStats[];
  searchTerm: string;
  exactMatch: boolean;
  showScrobbles: boolean;
  className?: string;
}

type SortField = 'name' | 'artist' | 'daysSinceAdded' | 'scrobbles';
type SortOrder = 'asc' | 'desc';

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <div className="text-pink-200">
          {filteredAndSortedTracks.length} result{filteredAndSortedTracks.length !== 1 ? 's' : ''}
        </div>
        {showScrobbles && (
          <div className="text-pink-200">
            {totalScrobbles} scrobbles
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-center text-white">
          <thead>
            <tr>
              <th 
                className="cursor-pointer select-none p-3 hover:bg-white/10"
                onClick={() => handleSort('name')}
              >
                Title <SortIcon field="name" />
              </th>
              <th 
                className="cursor-pointer select-none p-3 hover:bg-white/10"
                onClick={() => handleSort('artist')}
              >
                Artist <SortIcon field="artist" />
              </th>
              <th 
                className="cursor-pointer select-none p-3 hover:bg-white/10"
                onClick={() => handleSort('daysSinceAdded')}
              >
                Days Since Added <SortIcon field="daysSinceAdded" />
              </th>
              {showScrobbles && (
                <th 
                  className="cursor-pointer select-none p-3 hover:bg-white/10"
                  onClick={() => handleSort('scrobbles')}
                >
                  Scrobbles <SortIcon field="scrobbles" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTracks.map((track, index) => (
              <tr key={index} className="border-t border-white/20 hover:bg-white/5">
                <td className="p-3">{track.track.name}</td>
                <td className="p-3">{track.track.artists.map(a => a.name).join(', ')}</td>
                <td className="p-3">{track.daysSinceAdded}</td>
                {showScrobbles && (
                  <td className="p-3">{track.scrobbles || 0}</td>
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
      
      <div className="mt-4 text-sm text-gray-400 text-center">
        Click any column title to sort (like you do in Spotify)
      </div>
    </div>
  );
};

export default TrackTable; 