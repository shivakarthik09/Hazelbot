import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const TrainingPanel = () => {
  const [trainingData, setTrainingData] = useState(null);
  const [newIntent, setNewIntent] = useState({
    tag: '',
    patterns: [''],
    responses: ['']
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/training-data`);
      setTrainingData(response.data);
    } catch (err) {
      setError('Failed to fetch training data');
      console.error('Error:', err);
    }
  };

  const handleAddPattern = () => {
    setNewIntent(prev => ({
      ...prev,
      patterns: [...prev.patterns, '']
    }));
  };

  const handleAddResponse = () => {
    setNewIntent(prev => ({
      ...prev,
      responses: [...prev.responses, '']
    }));
  };

  const handlePatternChange = (index, value) => {
    const newPatterns = [...newIntent.patterns];
    newPatterns[index] = value;
    setNewIntent(prev => ({
      ...prev,
      patterns: newPatterns
    }));
  };

  const handleResponseChange = (index, value) => {
    const newResponses = [...newIntent.responses];
    newResponses[index] = value;
    setNewIntent(prev => ({
      ...prev,
      responses: newResponses
    }));
  };

  const handleRemovePattern = (index) => {
    const newPatterns = newIntent.patterns.filter((_, i) => i !== index);
    setNewIntent(prev => ({
      ...prev,
      patterns: newPatterns
    }));
  };

  const handleRemoveResponse = (index) => {
    const newResponses = newIntent.responses.filter((_, i) => i !== index);
    setNewIntent(prev => ({
      ...prev,
      responses: newResponses
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty patterns and responses
    const filteredIntent = {
      ...newIntent,
      patterns: newIntent.patterns.filter(p => p.trim() !== ''),
      responses: newIntent.responses.filter(r => r.trim() !== '')
    };

    if (filteredIntent.patterns.length === 0 || filteredIntent.responses.length === 0) {
      setError('Please add at least one pattern and one response');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/train`, filteredIntent);
      setSuccess('Training data updated successfully');
      setNewIntent({
        tag: '',
        patterns: [''],
        responses: ['']
      });
      fetchTrainingData();
    } catch (err) {
      setError('Failed to update training data');
      console.error('Error:', err);
    }
  };

  const handleDeleteIntent = async (tag) => {
    try {
      // Note: You'll need to implement this endpoint in your backend
      await axios.delete(`${API_URL}/api/train/${tag}`);
      setSuccess('Intent deleted successfully');
      fetchTrainingData();
    } catch (err) {
      setError('Failed to delete intent');
      console.error('Error:', err);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary">
        Train HazelBot
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Intent
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Intent Tag"
                value={newIntent.tag}
                onChange={(e) => setNewIntent(prev => ({ ...prev, tag: e.target.value }))}
                margin="normal"
                required
                placeholder="e.g., menu, hours, location"
              />
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Patterns
              </Typography>
              {newIntent.patterns.map((pattern, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Pattern ${index + 1}`}
                    value={pattern}
                    onChange={(e) => handlePatternChange(index, e.target.value)}
                    placeholder="e.g., what's on the menu"
                  />
                  <IconButton 
                    onClick={() => handleRemovePattern(index)}
                    disabled={newIntent.patterns.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddPattern}
                sx={{ mb: 2 }}
              >
                Add Pattern
              </Button>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Responses
              </Typography>
              {newIntent.responses.map((response, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Response ${index + 1}`}
                    value={response}
                    onChange={(e) => handleResponseChange(index, e.target.value)}
                    multiline
                    rows={2}
                    placeholder="e.g., Here's our menu..."
                  />
                  <IconButton 
                    onClick={() => handleRemoveResponse(index)}
                    disabled={newIntent.responses.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddResponse}
                sx={{ mb: 2 }}
              >
                Add Response
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Save Intent
              </Button>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Intents
            </Typography>
            {trainingData?.intents.map((intent) => (
              <Card key={intent.tag} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {intent.tag}
                    </Typography>
                    <IconButton 
                      onClick={() => handleDeleteIntent(intent.tag)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Patterns:
                  </Typography>
                  <List dense>
                    {intent.patterns.map((pattern, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={pattern} />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="subtitle2" gutterBottom>
                    Responses:
                  </Typography>
                  <List dense>
                    {intent.responses.map((response, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={response} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TrainingPanel; 