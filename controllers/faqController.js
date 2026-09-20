import FAQ from '../models/FAQ.js';

/**
 * @desc    Get all FAQs with category, audience, and search filters
 * @route   GET /api/v1/faqs
 * @access  Public / Private
 */
export const getAllFaqs = async (req, res, next) => {
  try {
    const { category, search, audience } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (audience) filter.targetAudience = { $in: [audience, 'all'] };

    if (search) {
      filter.$text = { $search: search };
    }

    const faqs = await FAQ.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { helpfulCount: -1, viewCount: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single FAQ by ID & increment view count
 * @route   GET /api/v1/faqs/:id
 * @access  Public / Private
 */
export const getFaqById = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ item not found.' });
    }

    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new FAQ item
 * @route   POST /api/v1/faqs
 * @access  Private (Admin)
 */
export const createFaq = async (req, res, next) => {
  try {
    const { question, answer, category, tags, targetAudience } = req.body;

    const faq = await FAQ.create({
      question,
      answer,
      category,
      tags: tags || [],
      targetAudience: targetAudience || ['all'],
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'FAQ published successfully.',
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update FAQ item
 * @route   PUT /api/v1/faqs/:id
 * @access  Private (Admin)
 */
export const updateFaq = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ item not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully.',
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete FAQ item
 * @route   DELETE /api/v1/faqs/:id
 * @access  Private (Admin)
 */
export const deleteFaq = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ item not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ item deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vote FAQ as helpful or not helpful
 * @route   POST /api/v1/faqs/:id/vote
 * @access  Private
 */
export const voteFaq = async (req, res, next) => {
  try {
    const { isHelpful } = req.body;
    const updateField = isHelpful ? { helpfulCount: 1 } : { notHelpfulCount: 1 };

    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { $inc: updateField },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ item not found.' });
    }

    res.status(200).json({
      success: true,
      helpfulCount: faq.helpfulCount,
      notHelpfulCount: faq.notHelpfulCount
    });
  } catch (error) {
    next(error);
  }
};
