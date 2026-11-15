
/*
 * Upstream Partner API Version Adapter
 *
 * This example follows the Week 13 lab's sample:
 *
 * V1: Bare array with dueDate.
 * V2: Object containing data, with due.
 *
 * IMPORTANT:
 * Replace the endpoint paths and response fields
 * using your actual partner's deprecation notice.
 */

const versions = {

  v1: {
    path: '/tasks',

    parse: (body) => {
      if (!Array.isArray(body)) {
        throw new Error('unexpected v1 shape');
      }

      return body.map((item) => ({
        title: item.title,
        dueDate: item.dueDate
      }));
    }
  },

  v2: {
    path: '/v2/tasks',

    parse: (body) => {
      if (!body || !Array.isArray(body.data)) {
        throw new Error('unexpected v2 shape');
      }

      return body.data.map((item) => ({
        title: item.title,
        dueDate: item.due
      }));
    }
  }

};

module.exports = { versions };
