import APIError from '../helpers/APIError'

export default class {
  static async findOneOrCreate (condition, doc) {
    try {
      const channel = await this.findOne(condition).exec()
      if (channel) {
        return { found: Promise.resolve(channel) }
      }
      const newChannel = await this.create(doc)
      return { new: Promise.resolve(newChannel) }
    } catch (error) {
      const err = new APIError(`Fatal Error: ${error.message}.`)
      return Promise.reject(err)
    }
  }

  static async get (id) {
    try {
      const model = await this.findById(id).exec()
      if (model) {
        return model
      }
      const err = new APIError('No such instance exists!')
      return Promise.reject(err)
    } catch (error) {
      const err = new APIError(`Fatal Error: ${error.message}.`)
      return Promise.reject(err)
    }
  }

  static async list ({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec()
  }
}
