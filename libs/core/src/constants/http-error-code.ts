import { HttpStatus } from '@nestjs/common';

/**
 * HTTP 错误码映射表
 * 对应 NestJS 中的各种 HttpException
 */
export const HTTP_ERROR_CODE = {
    // 4xx 客户端错误
    [HttpStatus.BAD_REQUEST]: '错误的请求', // BadRequestException
    [HttpStatus.UNAUTHORIZED]: '未认证的用户', // UnauthorizedException
    [HttpStatus.PAYMENT_REQUIRED]: '需要付费', // 402 (很少使用)
    [HttpStatus.FORBIDDEN]: '拒绝访问', // ForbiddenException
    [HttpStatus.NOT_FOUND]: '请求的资源未找到', // NotFoundException
    [HttpStatus.METHOD_NOT_ALLOWED]: '请求方法不支持', // MethodNotAllowedException
    [HttpStatus.NOT_ACCEPTABLE]: '请求的内容类型不被接受', // NotAcceptableException
    [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: '需要代理认证', // 407 (很少使用)
    [HttpStatus.REQUEST_TIMEOUT]: '请求超时', // RequestTimeoutException
    [HttpStatus.CONFLICT]: '请求冲突', // ConflictException
    [HttpStatus.GONE]: '请求的资源已不存在', // GoneException
    [HttpStatus.LENGTH_REQUIRED]: '需要Content-Length', // 411 (很少使用)
    [HttpStatus.PRECONDITION_FAILED]: '前置条件失败', // PreconditionFailedException
    [HttpStatus.PAYLOAD_TOO_LARGE]: '请求体过大', // PayloadTooLargeException
    [HttpStatus.URI_TOO_LONG]: 'URI过长', // 414 (很少使用)
    [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: '不支持的媒体类型', // UnsupportedMediaTypeException
    [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]: '请求范围不满足', // 416 (很少使用)
    [HttpStatus.EXPECTATION_FAILED]: '期望失败', // 417 (很少使用)
    [HttpStatus.I_AM_A_TEAPOT]: '我是一个茶壶', // ImATeapotException (彩蛋)
    [HttpStatus.MISDIRECTED]: '请求被误导', // 421 (很少使用)
    [HttpStatus.UNPROCESSABLE_ENTITY]: '业务异常', // UnprocessableEntityException
    [HttpStatus.FAILED_DEPENDENCY]: '依赖失败', // 424 (很少使用)
    [HttpStatus.TOO_MANY_REQUESTS]: '请求过于频繁', // 429 (很少使用)

    // 5xx 服务器错误
    [HttpStatus.INTERNAL_SERVER_ERROR]: '服务出错, 请稍后再试', // InternalServerErrorException
    [HttpStatus.NOT_IMPLEMENTED]: '功能未实现', // NotImplementedException
    [HttpStatus.BAD_GATEWAY]: '网关错误, 请稍后再试', // BadGatewayException
    [HttpStatus.SERVICE_UNAVAILABLE]: '服务暂时不可用', // ServiceUnavailableException
    [HttpStatus.GATEWAY_TIMEOUT]: '网关超时', // GatewayTimeoutException
    [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP版本不支持', // HttpVersionNotSupportedException
} as const;
