import { Router } from 'express';
import { prisma } from '@zuzz/database';

export const articlesRouter = Router();

/** GET /api/articles — list published articles */
articlesRouter.get('/', async (_req, res, next) => {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        type: true,
        title: true,
        titleHe: true,
        excerpt: true,
        coverImage: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
});

/** GET /api/articles/:slug — get a single article by slug */
articlesRouter.get('/:slug', async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({
      where: {
        slug: req.params.slug,
        isPublished: true,
      },
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
});
