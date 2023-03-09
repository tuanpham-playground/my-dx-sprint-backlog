const $ = jQuery;

export const generateGraphQLRequest = (
  url: string,
  headers: object,
  data: string
): Promise<any> => {
  return $.ajax({
    url: url,
    method: "post",
    headers: headers,
    data: data,
  });
};

export const makeGraphQLRequest = (
  url: string,
  headers: object,
  data: string,
  successCallback: any
) => {
  $.ajax({
    url: url,
    method: "post",
    headers: headers,
    data: data,
    success: (response: any) => {
      if (response.errors) {
        handleError(response.errors);
      }

      if (response.data) {
        successCallback(response.data);
      }
    },
    error: ajaxErrorHandler,
  });
};

const handleError = (errors: any[]) => {
  let errorMessage: string = "";
  errors.forEach(
    (error: {
      message: string;
      locations: Array<{ line: number; column: number }>;
    }) => {
      errorMessage += `${error.message}\n`;
    }
  );
  alert(errorMessage);
};

const ajaxErrorHandler = (error: any) => {
  alert(error);
};
