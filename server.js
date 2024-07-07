const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/voting', { useNewUrlParser: true, useUnifiedTopology: true });

const voteSchema = new mongoose.Schema({
  aadhar: { type: String, unique: true, required: true },
  party: { type: String, required: true }
});

const Vote = mongoose.model('Vote', voteSchema);

// Endpoint to check if Aadhar is used
app.post('/check-aadhar', async (req, res) => {
  const { aadhar } = req.body;

  if (!aadhar || aadhar.length !== 12 || !/^\d+$/.test(aadhar)) {
    return res.status(400).json({ message: 'Invalid Aadhar number' });
  }

  try {
    const existingVote = await Vote.findOne({ aadhar });
    if (existingVote) {
      return res.status(400).json({ message: 'Aadhar number already used for voting' });
    }

    res.status(200).json({ message: 'Aadhar number is valid' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to submit vote
app.post('/vote', async (req, res) => {
  const { aadhar, party } = req.body;

  if (!aadhar || !party) {
    return res.status(400).json({ message: 'Aadhar number and party are required' });
  }

  if (aadhar.length !== 12 || !/^\d+$/.test(aadhar)) {
    return res.status(400).json({ message: 'Aadhar number must be 12 digits' });
  }

  try {
    const existingVote = await Vote.findOne({ aadhar });

    if (existingVote) {
      return res.status(400).json({ message: 'Aadhar number already used for voting' });
    }

    const newVote = new Vote({ aadhar, party });
    await newVote.save();

    res.status(200).json({ message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to get vote counts
app.get('/counts', async (req, res) => {
  try {
    const votes = await Vote.aggregate([
      { $group: { _id: '$party', count: { $sum: 1 } } },
      { $sort: { count: -1 } } // Sort in descending order
    ]);

    res.status(200).json(votes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
app.listen(port, () => console.log(`Server running on port ${port}`));
