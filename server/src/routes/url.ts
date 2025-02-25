import { Router } from 'express';
import {
  createShortUrl,
  getAllUserUrls,
  deleteUrlById,
  deleteAllUserUrls,
} from '../controllers/urlController';
import validate from '../middlewares/validator';
import {
  hasUserIdValidationRules,
  createShortURLValidationRules,
  deleteAllUserURLsValidationRules,
} from '../middlewares/validateURL';
import { verifyAuthToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /urls:
 *   get:
 *     summary: Get all URLs for a user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of URLs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/URL'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No URLs found for the user
 */
router.get('/', verifyAuthToken, hasUserIdValidationRules(), validate, getAllUserUrls);

/**
 * @swagger
 * /urls:
 *   post:
 *     summary: Create a new short URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *               - userId
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Short URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/URL'
 *       400:
 *         description: Invalid URL format or missing userId
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyAuthToken, createShortURLValidationRules(), validate, createShortUrl);

/**
 * @swagger
 * /urls/{id}:
 *   delete:
 *     summary: Delete a URL by ID
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: URL ID
 *     responses:
 *       204:
 *         description: URL deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only delete own URLs
 *       404:
 *         description: URL not found
 */
router.delete('/:id', verifyAuthToken, hasUserIdValidationRules(), validate, deleteUrlById);

/**
 * @swagger
 * /urls:
 *   delete:
 *     summary: Delete all URLs for a user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       204:
 *         description: All URLs deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only delete own URLs
 */
router.delete('/', verifyAuthToken, deleteAllUserURLsValidationRules(), validate, deleteAllUserUrls);

export default router;
