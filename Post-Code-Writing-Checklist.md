# Post-Code Writing Checklist for SVG Toolbelt

## Universal Checklist After Writing Any Code

This checklist MUST be followed after implementing code for ANY merge request. Every single item must be checked before considering the task complete.

### 1. **Code Quality Checks** ✅

#### TypeScript Compilation
```bash
# Verify TypeScript compiles without errors
npm run type-check
```
- [ ] Zero TypeScript errors
- [ ] All types are properly defined (no `any` unless absolutely necessary)
- [ ] Strict mode compliance verified

#### Linting
```bash
# Run ESLint to check for code quality issues
npm run lint

# Auto-fix what can be fixed
npm run lint:fix
```
- [ ] Zero ESLint errors
- [ ] Zero ESLint warnings (or documented why they're acceptable)
- [ ] All auto-fixable issues resolved

### 2. **Testing Requirements** 🧪

#### Run Existing Tests
```bash
# Run all tests to ensure nothing broke
npm test
```
- [ ] All existing tests still pass
- [ ] No console errors or warnings in tests

#### Write New Tests
For EVERY new feature, function, or bug fix:
- [ ] Unit tests written for new functions/methods
- [ ] Integration tests written for feature interactions
- [ ] Edge cases covered (null, undefined, empty arrays, etc.)
- [ ] Error conditions tested
- [ ] Type tests written for new TypeScript types/interfaces

#### Coverage Check
```bash
# Generate coverage report
npm run test:coverage
```
- [ ] Code coverage remains ≥95%
- [ ] New code has 100% coverage
- [ ] No untested branches or statements

### 3. **Documentation Updates** 📚

#### Code Documentation
- [ ] All new public APIs have JSDoc comments
- [ ] JSDoc includes:
  - [ ] Description of what the function/class does
  - [ ] `@param` tags for all parameters
  - [ ] `@returns` tag describing return value
  - [ ] `@throws` tag if exceptions are thrown
  - [ ] `@example` with usage code
  - [ ] `@since` tag with version number

Example:
```typescript
/**
 * Applies zoom to the SVG at a specific point
 * @param x - The x-coordinate in container space
 * @param y - The y-coordinate in container space
 * @param delta - The zoom delta (positive for zoom in, negative for zoom out)
 * @throws {RangeError} If delta would exceed min/max scale limits
 * @example
 * ```typescript
 * toolbelt.zoomAt(100, 200, 0.1); // Zoom in by 10% at point (100, 200)
 * ```
 * @since 1.0.0
 */
public zoomAt(x: number, y: number, delta: number): void {
  // implementation
}
```

#### Update README if needed
- [ ] New features documented in README
- [ ] Configuration options updated
- [ ] Examples updated or added

#### Update CHANGELOG
- [ ] Add entry under "Unreleased" section
- [ ] Follow conventional commit format

### 4. **Build Verification** 🏗️

```bash
# Build the library
npm run build
```
- [ ] Build completes without errors
- [ ] All output files generated in `dist/`:
  - [ ] `svg-toolbelt.mjs` (ESM)
  - [ ] `svg-toolbelt.cjs` (CommonJS)
  - [ ] `svg-toolbelt.umd.js` (UMD)
  - [ ] `style.css`
  - [ ] `index.d.ts` (TypeScript declarations)

#### Bundle Size Check
```bash
# Open the bundle analysis report
open dist/stats.html
```
- [ ] Bundle size hasn't increased significantly
- [ ] No unexpected dependencies included
- [ ] If size increased, it's justified and documented

### 5. **Demo Updates** 🎯

#### Update Demo Pages
- [ ] `demo/index.html` works with new code
- [ ] `demo/simple.html` works with new code
- [ ] `demo/multiple.html` works with new code
- [ ] New features demonstrated in demos
- [ ] No console errors in demos

#### Test Demo Locally
```bash
# Start the demo server
npm run demo
# or
npm run build && npm run serve
```
- [ ] All demos load correctly
- [ ] New features work as expected
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### 6. **Integration Testing** 🔌

#### Test as External Package
```bash
# Pack the library
npm pack

# In a separate directory
mkdir test-integration
cd test-integration
npm init -y
npm install ../path/to/svg-toolbelt-*.tgz
```

Create test file:
```javascript
// test-esm.mjs
import { SvgToolbelt } from '@scope/svg-toolbelt';
console.log('ESM import works:', typeof SvgToolbelt);

// test-cjs.js
const { SvgToolbelt } = require('@scope/svg-toolbelt');
console.log('CJS require works:', typeof SvgToolbelt);
```

- [ ] ESM import works
- [ ] CJS require works
- [ ] TypeScript types work
- [ ] CSS is automatically included

### 7. **Security Checks** 🔒

```bash
# Check for vulnerabilities
npm audit

```
- [ ] No high or critical vulnerabilities
- [ ] All vulnerabilities documented if they can't be fixed

### 8. **Performance Validation** ⚡

For performance-related changes:
- [ ] Performance benchmarks run
- [ ] No performance regressions
- [ ] Frame rate stays at 60fps
- [ ] Memory usage stable (no leaks)

### 9. **Accessibility Validation** ♿

For UI-related changes:
- [ ] ARIA attributes added where needed
- [ ] Keyboard navigation works
- [ ] Screen reader tested (or simulated)
- [ ] Color contrast meets WCAG AA standards

### 10. **Git Hygiene** 🧹

#### Commit Message
- [ ] Follows conventional commit format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation only
  - `style:` for formatting (no code change)
  - `refactor:` for code restructuring
  - `test:` for test additions/changes
  - `chore:` for maintenance tasks

Example:
```
feat: add momentum scrolling to touch interactions

- Implement physics-based momentum calculation
- Add deceleration on touch end
- Make momentum configurable via options

Closes #123
```

#### Branch Management
- [ ] Branch name descriptive (e.g., `feat/momentum-scrolling`)
- [ ] Branch up to date with main
- [ ] No merge conflicts

### 11. **Final Checks** ✔️

#### Manual Testing Checklist
- [ ] Zoom in/out works with mouse wheel
- [ ] Pan works with mouse drag
- [ ] Touch pinch zoom works (if applicable)
- [ ] Touch pan works (if applicable)
- [ ] Keyboard shortcuts work
- [ ] Double-click reset works
- [ ] Controls buttons work
- [ ] Fullscreen works (if available)
- [ ] Zoom indicator appears and fades
- [ ] No console errors or warnings

#### Code Review Readiness
- [ ] Self-review completed
- [ ] No commented-out code
- [ ] No debug console.log statements
- [ ] No TODO comments (or they're tracked in issues)
- [ ] Code follows project style guide
- [ ] Complex logic has explanatory comments

### 12. **PR Description Template** 📝

When creating the Pull Request, include:

```markdown
## Description
Brief description of what this MR accomplishes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Changes Made
- List specific changes
- Include technical details
- Reference any design decisions

## Testing
- Describe tests added
- List manual testing performed
- Include browser/environment tested

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Bundle size impact is acceptable

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #[issue number]
```

---

## Quick Command Reference

```bash
# Full validation sequence
npm run prepublishOnly
```


---

## For AI Code Generation

When asking an AI to implement code for an MR, provide this instruction:

> "After generating the code, you MUST verify it meets ALL items in the Post-Code Writing Checklist. Specifically:
> 1. The code must compile with TypeScript strict mode
> 2. It must pass all ESLint rules
> 3. It must include comprehensive tests achieving 100% coverage
> 4. All public APIs must have complete JSDoc documentation
> 5. The implementation must handle all edge cases and errors gracefully
> 6. Generate any necessary type tests for new interfaces
> 7. Update any affected demo files
> 8. Ensure the code is production-ready and follows all security best practices"

This ensures the AI delivers complete, tested, documented code ready for review.