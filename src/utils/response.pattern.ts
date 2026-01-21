export default function responsePattern({
  statusCode,
  message,
  data,
}: {
  statusCode: number;
  message: string;
  data: Array<object> | object | null;
}) {
  return {
    statusCode,
    message,
    data,
  };
}
