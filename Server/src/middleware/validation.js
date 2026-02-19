const Joi = require('joi');

/**
 * Request validation middleware using Joi
 * Validates req.body, req.query, and req.params
 */
const validate = (schema, options = {}) => {
  return (req, res, next) => {
    // Determine what to validate based on request method and options
    const toValidate = {
      body: req.body,
      query: req.query,
      params: req.params
    };

    // If options specify a specific part to validate, use only that
    const dataToValidate = options.part ? toValidate[options.part] : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    // Store validated data
    if (options.part === 'query') {
      req.validatedQuery = value;
    } else if (options.part === 'params') {
      req.validatedParams = value;
    } else {
      req.validatedBody = value;
    }

    next();
  };
};

module.exports = validate;
