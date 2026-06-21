# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a security problem. Email
Barprojectsandbuilds@gmail.com with the details and steps to reproduce. You will
get an acknowledgement, and a fix or mitigation will follow.

## Supported versions

This project is pre-1.0 (0.x). Security fixes land on the latest commit on
`main`.

## Notes on the engine

The MDP engine renders content that may be untrusted. Input is HTML-escaped
before rendering, and link schemes are restricted so only safe links pass
through. The source format intentionally allows no raw HTML, no inline CSS, and
no scripting. If you find a way to inject markup or a script through an MDP
source, please treat it as a vulnerability and report it.
