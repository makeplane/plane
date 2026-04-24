# Cost & Performance Optimization

Model selection strategies and budget guidelines.

## Model Selection Strategy

### 1. Exploration Phase
Use fast model (3-5 variations):
- **Cost**: ~$0.02 per image
- **Speed**: ~5-10 seconds per generation
- **Use for**: Rapid iteration, aesthetic exploration

### 2. Refinement Phase
Use standard model (1-2 variations):
- **Cost**: ~$0.04 per image
- **Speed**: ~10-20 seconds per generation
- **Use for**: Production-ready assets

### 3. Final Polish
Use ultra model (1 generation):
- **Cost**: ~$0.08 per image
- **Speed**: ~20-30 seconds per generation
- **Use for**: Hero images, marketing materials, critical assets

## Analysis Model Strategy

- Use gemini-2.5-flash for all analysis (vision understanding)
- **Cost**: ~$0.001 per analysis
- **Speed**: ~2-5 seconds per analysis
- **Token-efficient**: Images count as ~258-1548 tokens

## Budget Guidelines

- **Small project**: 10-20 images, ~$2-5 total
- **Medium project**: 50-100 images, ~$10-20 total
- **Large project**: 200+ images, ~$50+ total

## Optimization Tips

1. **Use fast model first**: Explore variations cheaply before committing to production quality
2. **Batch analyze**: Analyze multiple variations simultaneously to save time
3. **Reuse successful prompts**: Once you find a working prompt, reuse it with variations
4. **Generate responsive variants separately**: Only create mobile versions for assets that need them
5. **Skip ultra model unless critical**: Standard quality often sufficient for most assets
