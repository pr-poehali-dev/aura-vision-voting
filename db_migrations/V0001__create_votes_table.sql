
CREATE TABLE IF NOT EXISTS t_p54632608_aura_vision_voting.votes (
  id SERIAL PRIMARY KEY,
  country_id VARCHAR(50) NOT NULL,
  voter_id VARCHAR(128) NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 1 CHECK (vote_count BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_id, voter_id)
);
