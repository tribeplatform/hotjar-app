import { NextFunction, Request, Response } from 'express';

import { Types } from '@tribeplatform/gql-client';
import { createLogger } from '@/utils/logger';
import { Logger } from '@tribeplatform/node-logger';

const DEFAULT_SETTINGS = {}
const SITE_ID_REGEX = /^([0-9]+)$/

class WebhookController {
  private readonly logger: Logger
  constructor(){
    this.logger = createLogger(WebhookController.name)
  }
  public index = async (req: Request, res: Response, next: NextFunction) => {
    const input = req.body;
    try {
      if (input.data?.challenge) {
        return res.json({
          type: 'TEST',
          status: 'SUCCEEDED',
          data: {
            challenge: req.body?.data?.challenge,
          },
        });
      }
      let result: any = {
        type: input.type,
        status: 'SUCCEEDED',
        data: {},
      };
      this.logger.log(`Incoming webhook ${JSON.stringify(input)}`, {
        network: input?.networkId,
        entity: input?.context,
        type: input?.type,
        actor: input?.actor?.id,
      })
      switch (input.type) {
        case 'GET_SETTINGS':
          result = await this.getSettings(input);
          break;
        case 'UPDATE_SETTINGS':
          result = await this.updateSettings(input);
          break;
        case 'SUBSCRIPTION':
          result = await this.handleSubscription(input);
          break;
      }
      res.status(200).json(result);
    } catch (error) {
      this.logger.error(error);
      return {
        type: input.type,
        status: 'FAILED',
        data: {},
      };
    }
  };

  /**
   *
   * @param input
   * @returns { type: input.type, status: 'SUCCEEDED', data: {} }
   * TODO: Elaborate on this function
   */
  private async getSettings(input) {
    const currentSettings = input.currentSettings[0]?.settings || {};
    let defaultSettings;
    switch (input.context) {
      case Types.PermissionContext.NETWORK:
        defaultSettings = DEFAULT_SETTINGS;
        break;
      default:
        defaultSettings = {};
    }
    const settings = {
      ...defaultSettings,
      ...currentSettings,
    };
    return {
      type: input.type,
      status: 'SUCCEEDED',
      data: settings,
    };
  }

  /**
   *
   * @param input
   * @returns { type: input.type, status: 'SUCCEEDED', data: {} }
   * TODO: Elaborate on this function
   */
  private async updateSettings(input) {
    if (!input.data.settings?.siteId) {
      return {
        type: input.type,
        status: 'FAILED',
        errorCode: 112,
        errorMessage: `Missing required parameter siteId.`,
      }
    } else if (!SITE_ID_REGEX.test(input.data.settings?.siteId)) {
      return {
        type: input.type,
        status: 'FAILED',
        errorCode: 106,
        errorMessage: `Site ID is in an invalid format.`,
      }
    }
    return {
      type: input.type,
      status: 'SUCCEEDED',
      data: { toStore: input.data.settings },
    };
  }

  /**
   *
   * @param input
   * @returns { type: input.type, status: 'SUCCEEDED', data: {} }
   * TODO: Elaborate on this function
   */
  private async handleSubscription(input) {
    return {
      type: input.type,
      status: 'SUCCEEDED',
      data: {},
    };
  }
}

export default WebhookController;
