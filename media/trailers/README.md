# Trailers (task 1.3.3)

Three 12-second, 1920x1080, muted title trailers made with HyperFrames: F1Jobs.io, Vastra Kala and
Christ University. One composition (`index.html`) and one variables file per title
(`variables/<slug>.json`). Beats and design notes are in `shot-plan.json`.

```bash
npm run art                     # from the repo root: key art and title lettering
npm run trailers:assets         # copies key art, lettering, ident and font into assets/
cd media/trailers
npx hyperframes check .
for s in f1jobs vastra-kala christ-university clinical youth-for-parivarthan; do
  npx hyperframes render . --strict-variables --variables-file variables/$s.json --crf 23 -o renders/$s.mp4
done
cd ../..
npm run trailers:finalize       # MP4 + WebM + poster + captions into public/trailers/, 2 MB budget
```

Every number on screen must be one of her confirmed figures; `tests/trailers.test.ts` checks it.
