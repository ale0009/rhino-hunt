# Can you solve The Rhino Hunt?

*[Español](README.md)*

A single-case digital forensics game in the browser (interface in Spanish). You are a junior analyst on **"The Rhino Hunt"**, NIST's public practice case (CFReDS, DFRWS 2005): a law punishes owning nine or more unique rhino pictures, the suspect wiped his hard drive and reformatted his USB key, and you have to prove it.

## How to play

Six steps, each with one simple mechanic:

1. **Chain of custody** · choose how evidence is logged and copied.
2. **Verify the hash** · type the lab's MD5 and compare it with NIST's record.
3. **History and conversations** · mark the useful lines in the network traces and the diary.
4. **Recover deleted files** · identify each file by its signature (fake extensions included) and open what is encrypted.
5. **Timeline** · drag the events into order.
6. **Who, what and when** · conclude and profile the suspect with the SKRAM model.

Hints cost points; a rhino collection shows the legal threshold; sound is optional; and a plain-text **forensic report** can be copied or downloaded at the end.

Serve the folder with any static server (`python3 -m http.server`). Tests: `node --test`.

## Reusing it

- `js/caso.js`: the whole case as data.
- `js/motor.js`: pure rules (hash comparison, signature detection, scoring, report).
- `js/main.js`: the UI, the only file that touches the DOM.

## Background

Built from Mario and David's 2025 digital forensics coursework, which solved the case with Kali Linux, Autopsy, PhotoRec and Wireshark, plus a SKRAM profiling assignment. `/proceso/` covers the case, the design, the real tools it stands in for, Colombian law on chain of custody, and an errata list.

NIST's disk image and traces are **not redistributed**: only names, file signatures and published hashes are used. Source: [cfreds-archive.nist.gov/dfrws/Rhino_Hunt.html](https://cfreds-archive.nist.gov/dfrws/Rhino_Hunt.html) (image contributed by Golden G. Richard III).

## Credits

[Mario Puerta «ale0009»](https://github.com/ale0009) × [David Rincón «Kuronoma»](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/) · MIT License.
