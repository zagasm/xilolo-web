import { Link, Links, useNavigate } from "react-router-dom";
export function Error404() {
  const navigate = useNavigate();
  return (
    <div className="vh-100">
      <div className="container">
        <div className="row align-items-center vh-100">
          <div className="col-md-6">
            <img
              src={'/logo.png'}
              alt="Zagasm Logo"
              className="tw:w-[200px] tw:-ml-16"
            //   style={}
            />
            <h1
              style={{ color: "#050505" }}
              className=" display-3 font-weight-light"
            >
              Page not <span className="font-weight-bold">found</span>
            </h1>
            <p className="mb-0 lead">
              Oops! Looks like you followed a bad link.
            </p>
            <p className="lead mb-5">
              If you think this is a problem with us, please{" "}
              <a href="#">tell us</a>.
            </p>
            <button
              onClick={() => navigate(-1)}
              style={{ backgroundColor: "#050505", color: "white" }}
              className="btn  btn-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
