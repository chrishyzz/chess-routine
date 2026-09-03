interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="min-h-screen bg-secondary text-white">
      <header className="border-b border-gray-800 bg-primary">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <h1 className="text-xl font-bold">Chess Routine</h1>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="rounded-lg bg-primary p-6 border border-gray-800 space-y-4">
          <h2 className="text-xl font-semibold text-white">About this app</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Chess Routine is a minimalist app to track chess study in the same way you might use a fitness app for the gym.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Light-weight and flexible, you can log tasks – like solving puzzles, playing games or reading a book – and try to balance your time between studying openings, endgames or whatever else.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Visuals show how you’re actually spending your time and provide motivation to build consistent habits.
          </p>
        </div>

        <div className="rounded-lg bg-primary p-6 border border-gray-800 space-y-6">
          <h2 className="text-xl font-semibold text-white">Recommended resources</h2>
          
          <p className="text-gray-300 text-sm leading-relaxed">
            Ben Johnson has a <a href="https://www.perpetualchesspod.com/book-recommendations" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">mega list of resources, grouped by rating</a>.
          </p>

          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-1">Games & Analysis</h3>
              <p className="leading-relaxed">
                This category is for your own games only. Playing and studying on Lichess is great; the ChessDojo book about <a href="https://www.amazon.co.uk/How-Analyze-Your-Games-ChessDojo/dp/B0DP2X1T9D" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">how to study your own games</a> is a good resource. You might also spar positions with bots on <a href="https://chessiverse.com/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">Chessiverse</a>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Tactics</h3>
              <p className="leading-relaxed">
                Puzzles are easy to find. There’s Lichess and ChessTempo. I adore <a href="https://lichess.org/streak" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">Puzzle Streak</a> on Lichess. <a href="https://www.discochess.com/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">DiscoChess</a> is a fun way to do the Woodpecker method. For a little more comprehensive calculation training, I’ve been enjoying <a href="https://calculationtraining.com/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">Calculation Training</a>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Endgames</h3>
              <p className="leading-relaxed">
                Learn the basic endgame patterns from Lichess. Then maybe try Silman’s book Complete Endgame Course. Practice them (regular) via <a href="https://app.endgametrainer.com/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">Endgame Trainer</a>. Look at <a href="https://www.chessgames.com/perl/chesscollection?cid=1002457" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">Capablanca’s games</a>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Middlegames</h3>
              <p className="leading-relaxed">
                Michael Steen’s Simple Chess is a good book. As is Silman’s Reassess Your Chess. I also think looking over master games is great for this.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Openings</h3>
              <p className="leading-relaxed">
                Make a simple repertoire in a Lichess study and practice it on ChessTempo. Look at master games in your opening to learn middlegame and endgame ideas that come from the opening.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
