import { Modal } from "./Modal";

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="How Habit Casino works" size="lg">
      <div className="space-y-6 text-sm leading-relaxed">
        <Section heading="The big idea">
          <p>
            Habit Casino turns habit tracking into a slot machine. Doing a habit
            drops a colored paper clip into your <strong>bank</strong>. Spinning
            the wheel lets you win real-world rewards (Netflix, coffee, time off,
            anything you'd normally just consume). It's slot-machine psychology
            — variable rewards, near-misses, the rush of a jackpot — but the
            variable reward is something you actually want to limit, and the
            only way to enjoy it is to earn it here.
          </p>
        </Section>

        <Section heading="Setup: areas, habits, rewards, milestones">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Areas</strong> (1–5): big buckets of life. Default is
              three: Fitness, Career, Music. Each area is independent — its own
              habits, clips, jar, rewards.
            </li>
            <li>
              <strong>Habits</strong>: things you do daily. Each habit has an
              effort (e.g. "15 burpees"), a <em>clip yield</em> (1–20 clips per
              completion — set higher for harder habits), and a{" "}
              <em>daily target</em> (1–99 — how many times per day you can do
              it).
            </li>
            <li>
              <strong>Rewards</strong> (4 per area): T1, T2, T3, Jackpot. T1 is
              small, Jackpot is rare and big. Pick things you already love AND
              want to limit (because they cost time or money).
            </li>
            <li>
              <strong>Milestones</strong> (3 per area): big rewards unlocked
              after enough lifetime clips reach the jar — e.g. 25 clips →
              massage, 200 clips → PlayStation.
            </li>
          </ul>
        </Section>

        <Section heading="Daily flow">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Do a habit</strong>. Tap "+1 done" on its row. You earn
              that habit's clip yield in clips of random colors.
            </li>
            <li>
              <strong>Cash in clips</strong>. Go to the area's Spin tab. Every
              spin costs at least 1 clip:
              <ul className="list-disc pl-5 mt-1">
                <li>1 clip → T1-only spin</li>
                <li>2 same-color → T1+T2</li>
                <li>3 same-color → T1+T2+T3</li>
                <li>1 gold clip → all tiers (gold is rare, ~3% drop rate)</li>
              </ul>
            </li>
            <li>
              <strong>Spin the wheel</strong>. The wheel decides what you've
              actually earned. Go enjoy the reward — the app doesn't enforce
              anything, that's on you.
            </li>
          </ol>
          <p className="mt-2">
            Cashed clips drop into the <strong>jar</strong>. The jar fills toward
            your three milestones — clips in the jar count forever.
          </p>
        </Section>

        <Section heading="The wheel — fixed odds">
          <ul className="list-disc pl-5 space-y-1">
            <li>T1 → <strong>40%</strong></li>
            <li>T2 → <strong>30%</strong></li>
            <li>T3 → <strong>20%</strong></li>
            <li>Bonus → <strong>8%</strong></li>
            <li>Jackpot → <strong>2%</strong> (always paid)</li>
          </ul>
          <p className="mt-2">
            If the wheel lands on a tier you didn't activate (e.g. you cashed in
            1 clip and it landed T2 or T3) it's a <strong>loss</strong> — no
            reward, but your cashed clips still go into the jar toward your
            milestones. Cash in more next time to activate higher tiers and
            close those gaps.
          </p>
          <p className="mt-2">
            Win-rate by cash-in:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>1 clip (T1 only): 50% win, 50% loss</li>
            <li>2 same-color (T1+T2): 80% win, 20% loss</li>
            <li>3 same-color or gold (all tiers): 100% win, no loss</li>
          </ul>
        </Section>

        <Section heading="Bonus round">
          <p>When the wheel lands on Bonus:</p>
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>You're paid your activated-tier reward immediately.</li>
            <li>
              A bonus wheel pops up with 5 equal segments (20% each):
              <ul className="list-disc pl-5 mt-1">
                <li><strong>Free clip</strong> — a bonus clip in your bank</li>
                <li>
                  <strong>75% / 50% / 25% off</strong> — pick a habit, do that
                  fraction of its effort within 10 minutes for a free clip
                </li>
                <li>
                  <strong>Extra spin</strong> — two more bonus wheel spins
                  (chains up to 5 total before degrading to Free clip)
                </li>
              </ul>
            </li>
          </ol>
        </Section>

        <Section heading="The naked rule">
          <p>
            If you enjoy a reward without earning it ("naked"), confess it in
            the area's Jar tab. Penalties are real — they drain progress:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>T1 naked: -1 random bank clip, -2 jar clips</li>
            <li>T2 naked: -2 / -4</li>
            <li>T3 naked: -3 / -6</li>
            <li>Jackpot naked: -5 / -10</li>
          </ul>
          <p className="mt-2">
            The point isn't punishment — it's making the rule real. If using a
            reward without earning it cost you nothing, the system would
            collapse.
          </p>
        </Section>

        <Section heading="Daily reset">
          <p>
            At local midnight, your habit completion counts reset (you can do
            them again tomorrow). Bank, jar, history, milestones, and any active
            10-minute bonus discount timer all carry forward — only today's
            checkmarks reset.
          </p>
        </Section>

        <Section heading="Sync (optional)">
          <p>
            If you want to use Habit Casino on more than one device:
          </p>
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>
              Set a passphrase in <strong>Settings → Sync</strong>. Use the same
              passphrase on every device you want to share data with.
            </li>
            <li>
              First time: tap <strong>Push to cloud</strong> on the device with
              your real data, then on the new device tap{" "}
              <strong>Pull from cloud</strong>.
            </li>
            <li>
              After that, sync runs automatically: on app open / tab focus it
              pulls if cloud is newer, pushes if local is. Every change pushes
              itself ~3 seconds later (debounced).
            </li>
            <li>
              <strong>Idle modal</strong>: if a tab is visible-but-untouched for
              5 minutes, it asks you to reload — protects against accidentally
              clobbering cloud with stale state.
            </li>
          </ol>
          <p className="mt-2">
            The passphrase is the only thing protecting your data — anyone who
            guesses it can read and overwrite. Use a long, unique one. There's
            no recovery if you forget it.
          </p>
        </Section>

        <Section heading="Tips">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Pick rewards you already love AND already feel slightly guilty
              about. The "earn it" framing converts guilt into momentum.
            </li>
            <li>
              Set clip yield higher for genuinely hard habits. A 5-min
              stretch can be 1 clip; a real gym session can be 5.
            </li>
            <li>
              Use daily target for habits you want to do multiple times: 5 sets
              of pushups → target 5 → five separate +1 done taps per day.
            </li>
            <li>
              Don't over-optimize cash-in. Spending 1 clip for a T1-only spin
              is fine — the dopamine is in the spin itself.
            </li>
            <li>
              Gold clip rate is per-clip, not per-tap. A yield-10 habit has
              roughly 3% × 10 ≈ 26% chance of producing at least one gold clip
              per completion.
            </li>
          </ul>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-semibold text-base mb-2">{heading}</h3>
      <div className="text-slate-700 dark:text-slate-300">{children}</div>
    </section>
  );
}
