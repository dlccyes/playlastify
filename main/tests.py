from django.test import TestCase
from .spotify_analyzer import SpotifyAnalyzer

# Create your tests here.

class SpotifyAnalyzerTestCase(TestCase):
    def test_spotify_analyzer_initialization(self):
        """Test that SpotifyAnalyzer can be initialized"""
        analyzer = SpotifyAnalyzer("test_token")
        self.assertEqual(analyzer.token, "test_token")
        self.assertIn("Authorization", analyzer.headers)
        self.assertEqual(analyzer.headers["Authorization"], "Bearer test_token")
    
    def test_calculate_average_audio_features_empty(self):
        """Test average audio features calculation with empty data"""
        analyzer = SpotifyAnalyzer("test_token")
        result = analyzer.calculate_average_audio_features([])
        
        expected_features = ['acousticness', 'danceability', 'duration_ms', 'energy', 
                           'instrumentalness', 'liveness', 'loudness', 'speechiness', 'tempo', 'valence']
        
        for feature in expected_features:
            self.assertIn(feature, result)
            self.assertEqual(result[feature], 0)
    
    def test_get_artist_distribution_empty(self):
        """Test artist distribution with empty tracks"""
        analyzer = SpotifyAnalyzer("test_token")
        result = analyzer.get_artist_distribution([])
        self.assertEqual(result, [])
    
    def test_get_date_distribution_empty(self):
        """Test date distribution with empty tracks"""
        analyzer = SpotifyAnalyzer("test_token")
        result = analyzer.get_date_distribution([], 'added')
        self.assertEqual(result, [])
