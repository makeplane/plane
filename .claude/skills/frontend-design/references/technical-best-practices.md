# Best Practices Checklists

Quality gates and checklists for asset generation workflows.

## Asset Generation Workflow

### Before Generating Assets
- [ ] Defined clear aesthetic direction from design brief
- [ ] Extracted color palette and typography character
- [ ] Identified asset purpose and integration context
- [ ] Considered accessibility and text overlay needs

### During Generation
- [ ] Crafted design-driven, contextual prompt
- [ ] Selected appropriate model and quality level
- [ ] Specified correct aspect ratio for use case
- [ ] Generated multiple variations if exploring

### After Generation
- [ ] Ran comprehensive visual analysis (score ≥ 7/10)
- [ ] Extracted exact color palette with hex codes
- [ ] Compared multiple variations and selected best
- [ ] Tested with overlaid text/UI elements
- [ ] Optimized file size for web performance
- [ ] Created responsive variants if needed
- [ ] Documented asset usage and guidelines

## Design Guideline Extraction Workflow

### When Analyzing Existing Designs
- [ ] Captured high-quality reference screenshots
- [ ] Ran comprehensive design analysis with structured prompts
- [ ] Extracted specific values (hex codes, px sizes, ms timings)
- [ ] Analyzed multiple screens for pattern consistency
- [ ] Validated font predictions against Google Fonts
- [ ] Documented findings in actionable format
- [ ] Created CSS variable specifications
- [ ] Saved extracted guidelines in project docs/

## Quality Gates

### Never Proceed to Integration Without
- [ ] Visual analysis score ≥ 7/10
- [ ] Extracted color palette documented
- [ ] Accessibility contrast checks passed
- [ ] Responsive variants generated
- [ ] File optimization completed
- [ ] Asset usage guidelines documented

## Final Checklist

Before considering any asset "done":
- [ ] Generated with design-driven prompt (not generic)
- [ ] Analyzed and scored ≥ 7/10
- [ ] Extracted color palette for CSS implementation
- [ ] Tested with UI overlays for readability
- [ ] Optimized for web (WebP/JPEG)
- [ ] Created responsive variants
- [ ] Documented usage guidelines
- [ ] Accessibility checks passed (contrast, alt text)
- [ ] Integrated into frontend with proper optimization

## Common Issues & Solutions

### Issue 1: Generated Asset Too Generic
**Symptoms**: Asset looks like stock photography, lacks design character
**Solution**:
- Refine prompt with specific aesthetic movements
- Reference artists/designers/styles explicitly
- Use more distinctive color directions
- Add contextual details that make it unique

### Issue 2: Inconsistent Design Language
**Symptoms**: Each generated asset feels unrelated
**Solution**:
- Extract and document design system from first successful generation
- Reuse color palette keywords in all subsequent prompts
- Maintain consistent aesthetic direction across generations
- Reference previous successful assets in new prompts

### Issue 3: Low Analysis Scores
**Symptoms**: Consistently getting scores < 7/10
**Solutions**:
- Review evaluation criteria—are they realistic?
- Study high-scoring designs for patterns
- Use design extraction on inspiration to learn what works
- Iterate prompt with specific improvements from analysis

### Issue 4: Slow Generation Times
**Symptoms**: Waiting too long for results
**Solutions**:
- Use fast model for exploration phase
- Generate in batches rather than sequentially
- Reserve ultra model only for final production assets
- Run analysis while next generation processes

**Remember**: Design first, generate second. Context is king. Iterate ruthlessly. Analysis is mandatory. Demand specifics, not generalities.
