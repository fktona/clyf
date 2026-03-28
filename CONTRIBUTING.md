# Contributing to @clyf/core

Thanks for your interest in contributing! Whether it's a bug report, feature idea, or a pull request — all contributions are welcome.

## Getting started

1. Fork and clone the repo:

```bash
git clone https://github.com/fktona/clyf.git
cd clyf
```

2. Install dependencies:

```bash
npm install
```

3. Run the tests to make sure everything works:

```bash
npm test
```

4. Build the project:

```bash
npm run build
```

## Making changes

1. Create a new branch from `main`:

```bash
git checkout -b my-change
```

2. Make your changes in the `src/` directory.

3. Add or update tests in `src/generateType.test.ts` if your change affects behaviour.

4. Run the tests before committing:

```bash
npm test
```

5. Commit your changes with a clear message:

```bash
git commit -m "fix: handle optional fields in nested objects"
```

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/) — prefixes like `feat:`, `fix:`, `chore:`, `docs:` are appreciated but not enforced.

## Pull requests

- Keep PRs focused — one feature or fix per PR.
- Describe what your change does and why.
- Make sure all tests pass.
- If you're adding a new feature, include a test for it.

## Reporting bugs

Open an [issue](https://github.com/fktona/clyf/issues) with:

- What you expected to happen
- What actually happened
- A minimal JSON input that reproduces the problem (if applicable)

## Feature ideas

Have an idea? Open an issue and describe the use case. Let's discuss it before jumping into code — this keeps everyone on the same page.

## Project structure

```
src/
  index.ts              # Public exports
  generateType.ts       # Core logic (hashing, caching, type generation)
  generateType.test.ts  # Tests
dist/                   # Compiled output (don't edit directly)
types/                  # Example generated types
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
