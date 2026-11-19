# Demo tutoring app — PM COACH

An advanced product-management practice app for Demo Mia. Turn podcast notes into five quick questions, in about seven minutes.

Built from the [starter kit](https://github.com/Mr-Higgs/devin-miro-starter-code), following the four screens of the [Demo Miro prototype](https://miro.com/app/board/uXjVEMVnhvA=/?moveToWidget=3458764691034281341).

## Try it

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000/onboard. Mia's role, goal and Advanced level are prefilled; all are editable. Press Next, then Start a new session.

Use the included **Lenny's Podcast: prioritization** sample, or choose/drop multiple episode-note files. Press Next to review the material, Next to practice, select an answer for each of the five scenarios, and Next for feedback. Practice again returns to setup.

## Multiple episodes

- Add up to five episodes together, as TXT, Markdown, PDF, JPG, PNG or WebP. You can add files in several selections and remove individual files.
- Expand “Add multiple episodes or paste notes” to paste an additional episode.
- Five questions cover **every uploaded episode**, keeping the session short. Each answer review cites the source episode and its exact takeaway.
- Limits: 15 MB per file, 20 pages and 20,000 extracted characters per session. At least a few complete, readable sentences are required per episode. Over-limit inputs are rejected rather than silently truncated.
- PDF text is extracted locally; scanned PDFs and photos use browser-side English OCR. OCR downloads its worker/language assets and needs a network connection on first use. If unavailable, paste the notes instead.

The bundled sample uses the kit's mock fixtures. Uploads use a deterministic, source-grounded recall generator in the feature extension area, **not the fixed mock fixture**. This works without an AI key and does not claim to be live AI. It tests takeaways from the supplied notes; it does not synthesize novel advice. The sample adds curated workplace scenarios that match the prototype.

## Data and scope

Next.js, React and TypeScript, with no database or sign-in. Text is stored on the server under `data/`, which is gitignored. Original upload files are processed in the browser; extracted notes are saved. This is a single-learner demo with a shared local profile, not a multi-tenant service.

Keep `data/` on persistent storage if deploying. Set `DATA_DIR` to use a different location. Serverless hosts with ephemeral filesystems are not suitable without replacing persistence in a follow-up.

## Verification

```sh
npx next typegen
npx tsc --noEmit
npm run lint
npx tsx --test src/features/episode-practice.test.ts
npm run build
```

The feature tests cover cross-episode coverage, grounding in unrelated uploaded notes, structural validation and correct/incorrect scoring through the unchanged core.

The starter routes, core modules and five `data-step` hooks are preserved. The under-ten-minute goal is a five-question design target, not a timer that cuts off the learner.

After approval to ship:

```sh
npm run check
npm run demo:record
```

The standardized recorder writes `submission/demo.webm` and screenshots. These and local learner data are excluded from git.
