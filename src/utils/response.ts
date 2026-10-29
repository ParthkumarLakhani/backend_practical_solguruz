
import type {
  Request,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import messages from "./messages.json";

type MessageDetails = {
  param?: string;
  type?: string;
  message?: string;
};

type LanguageMessages = Record<string, string>;
type Messages = Record<string, LanguageMessages>;

type ZodIssue = {
  code: string;
  path: PropertyKey[];
  message: string;
};

type ZodResult = {
  success: boolean;
  error?: {
    issues: ZodIssue[];
  };
};

class ResponseUtil {
  private getMessage(
    msg: string | MessageDetails,
    language = "en"
  ): string {
    const allMessages = messages as Messages;
    const localizedMessages =
      allMessages[language] ?? allMessages.en;

    if (typeof msg === "object" && msg !== null) {
      const param = msg.param;
      const type = msg.type;

      if (type?.includes("and")) {
        return msg.message ?? localizedMessages.SOMETHING_WENT_WRONG;
      }

      if (param && type?.includes("required")) {
        return localizedMessages.PARAMETERS_REQUIRED.replace(
          "@Parameter@",
          param
        );
      }

      if (param && type?.includes("min")) {
        return msg.message ?? localizedMessages.INVALID_REQUEST_DATA;
      }

      if (param && type) {
        return localizedMessages.INVALID_REQUEST_DATA.replace(
          "@Parameter@",
          param
        );
      }

      return msg.message ?? localizedMessages.SOMETHING_WENT_WRONG;
    }

    return (
      localizedMessages[msg] ??
      localizedMessages.SOMETHING_WENT_WRONG
    );
  }

  success<T>(
    res: ExpressResponse,
    msg: string,
    data?: T,
    statusCode = 200,
    language = "en"
  ): ExpressResponse {
    return res.status(statusCode).json({
      code: 1,
      status: "SUCCESS",
      message: this.getMessage(msg, language),
      data,
    });
  }

  error(
    res: ExpressResponse,
    msg: string | MessageDetails,
    statusCode = 500,
    language = "en"
  ): ExpressResponse {
    return res.status(statusCode).json({
      code: 0,
      status: "FAIL",
      message: this.getMessage(msg, language),
    });
  }

  zodResponse(
    result: ZodResult,
    req: Request,
    res: ExpressResponse,
    next: NextFunction
  ): ExpressResponse | void {
    if (result.success) {
      next();
      return;
    }

    const issue = result.error?.issues[0];

    if (!issue) {
      return this.error(
        res,
        "SOMETHING_WENT_WRONG",
        500,
        this.getLanguage(req)
      );
    }

    const param = issue.path.map(String).join(".");
    const language = this.getLanguage(req);

    let type = issue.code;

    // Map Zod issue codes to your existing message types.
    if (issue.code === "too_small") {
      type = "min";
    } else if (issue.code === "invalid_type") {
      type = "required";
    }

    return this.error(
      res,
      {
        param,
        type,
        message: issue.message,
      },
      400,
      language
    );
  }

  private getLanguage(req: Request): string {
    const language = req.headers.language;

    return typeof language === "string" ? language : "en";
  }
}

export default new ResponseUtil();
