import { HttpStatus } from '@nestjs/common';

/**
 * HTTP 状态码中文映射表
 * 包含 NestJS HttpStatus 枚举中的所有状态码
 */
export const HTTP_ERROR_CODE = {
    // 1xx 信息响应
    [HttpStatus.CONTINUE]: '继续', // 100
    [HttpStatus.SWITCHING_PROTOCOLS]: '切换协议', // 101
    [HttpStatus.PROCESSING]: '处理中', // 102
    [HttpStatus.EARLYHINTS]: '早期提示', // 103

    // 2xx 成功响应
    [HttpStatus.OK]: '请求成功', // 200
    [HttpStatus.CREATED]: '已创建', // 201
    [HttpStatus.ACCEPTED]: '已接受', // 202
    [HttpStatus.NON_AUTHORITATIVE_INFORMATION]: '非权威信息', // 203
    [HttpStatus.NO_CONTENT]: '无内容', // 204
    [HttpStatus.RESET_CONTENT]: '重置内容', // 205
    [HttpStatus.PARTIAL_CONTENT]: '部分内容', // 206
    [HttpStatus.MULTI_STATUS]: '多状态', // 207
    [HttpStatus.ALREADY_REPORTED]: '已报告', // 208
    [HttpStatus.CONTENT_DIFFERENT]: '内容不同', // 210

    // 3xx 重定向
    [HttpStatus.AMBIGUOUS]: '多种选择', // 300
    [HttpStatus.MOVED_PERMANENTLY]: '永久移动', // 301
    [HttpStatus.FOUND]: '找到', // 302
    [HttpStatus.SEE_OTHER]: '查看其他位置', // 303
    [HttpStatus.NOT_MODIFIED]: '未修改', // 304
    [HttpStatus.TEMPORARY_REDIRECT]: '临时重定向', // 307
    [HttpStatus.PERMANENT_REDIRECT]: '永久重定向', // 308

    // 4xx 客户端错误
    [HttpStatus.BAD_REQUEST]: '错误的请求', // 400 - BadRequestException
    [HttpStatus.UNAUTHORIZED]: '未认证的用户', // 401 - UnauthorizedException
    [HttpStatus.PAYMENT_REQUIRED]: '需要付费', // 402
    [HttpStatus.FORBIDDEN]: '拒绝访问', // 403 - ForbiddenException
    [HttpStatus.NOT_FOUND]: '请求的资源未找到', // 404 - NotFoundException
    [HttpStatus.METHOD_NOT_ALLOWED]: '请求方法不支持', // 405 - MethodNotAllowedException
    [HttpStatus.NOT_ACCEPTABLE]: '请求的内容类型不被接受', // 406 - NotAcceptableException
    [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: '需要代理认证', // 407
    [HttpStatus.REQUEST_TIMEOUT]: '请求超时', // 408 - RequestTimeoutException
    [HttpStatus.CONFLICT]: '请求冲突', // 409 - ConflictException
    [HttpStatus.GONE]: '请求的资源已不存在', // 410 - GoneException
    [HttpStatus.LENGTH_REQUIRED]: '需要Content-Length', // 411
    [HttpStatus.PRECONDITION_FAILED]: '前置条件失败', // 412 - PreconditionFailedException
    [HttpStatus.PAYLOAD_TOO_LARGE]: '请求体过大', // 413 - PayloadTooLargeException
    [HttpStatus.URI_TOO_LONG]: 'URI过长', // 414
    [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: '不支持的媒体类型', // 415 - UnsupportedMediaTypeException
    [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]: '请求范围不满足', // 416
    [HttpStatus.EXPECTATION_FAILED]: '期望失败', // 417
    [HttpStatus.MISDIRECTED]: '请求被误导', // 421
    [HttpStatus.UNPROCESSABLE_ENTITY]: '业务异常', // 422 - UnprocessableEntityException
    [HttpStatus.LOCKED]: '资源已被锁定', // 423
    [HttpStatus.FAILED_DEPENDENCY]: '依赖失败', // 424
    [HttpStatus.PRECONDITION_REQUIRED]: '需要前置条件', // 428
    [HttpStatus.TOO_MANY_REQUESTS]: '请求过于频繁', // 429
    [HttpStatus.UNRECOVERABLE_ERROR]: '不可恢复的错误', // 456

    // 5xx 服务器错误
    [HttpStatus.INTERNAL_SERVER_ERROR]: '服务出错, 请稍后再试', // 500 - InternalServerErrorException
    [HttpStatus.NOT_IMPLEMENTED]: '功能未实现', // 501 - NotImplementedException
    [HttpStatus.BAD_GATEWAY]: '网关错误, 请稍后再试', // 502 - BadGatewayException
    [HttpStatus.SERVICE_UNAVAILABLE]: '服务暂时不可用', // 503 - ServiceUnavailableException
    [HttpStatus.GATEWAY_TIMEOUT]: '网关超时', // 504 - GatewayTimeoutException
    [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP版本不支持', // 505 - HttpVersionNotSupportedException
    [HttpStatus.INSUFFICIENT_STORAGE]: '存储空间不足', // 507
    [HttpStatus.LOOP_DETECTED]: '检测到循环', // 508
} as const;
