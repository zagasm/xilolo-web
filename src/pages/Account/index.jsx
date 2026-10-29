import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { clearActiveAuthStorage } from "../../lib/authStorage";

// Components
import AccountCenter from "../../component/account/AccountCenter";
import DeactivateAccountModal from "../../component/account/DeactivateAccountModal";

// CSS
import "./accountStyling.css";

function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleOpenConfirm = () => {
    setIsConfirmOpen(true);
  };

  const handleForceLogout = () => {
    try {
      clearActiveAuthStorage();
    } catch (e) {
      console.error("Failed to clear localStorage", e);
    }
    if (logout) logout();
    navigate("/auth/signin", { replace: true });
  };

  const handleDeactivateSuccess = () => {
    // called from DeactivateAccountModal once API returns 200
    setIsSuccessOpen(true);
  };

  return (
    <Fragment>
      <div
        data-bounce-page="account"
        className="tw:min-h-screen tw:w-full tw:bg-white tw:px-3 tw:pb-24 tw:pt-24 tw:font-sans tw:md:px-6 tw:lg:px-8"
      >
        <div className="tw:mx-auto tw:w-full tw:max-w-6xl">
          <AccountCenter
            user={user}
            onLogout={handleForceLogout}
            onDeactivate={handleOpenConfirm}
          />
        </div>
      </div>

      {/* Deactivate modal (reason + password) */}
      <DeactivateAccountModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onSuccess={handleDeactivateSuccess}
      />

      {/* Success Modal */}
      <Transition appear show={isSuccessOpen} as={Fragment}>
        <Dialog
          as="div"
          className="tw:relative tw:z-50"
          onClose={handleForceLogout}
        >
          <Transition.Child
            as={Fragment}
            enter="tw:ease-out tw:duration-200"
            enterFrom="tw:opacity-0"
            enterTo="tw:opacity-100"
            leave="tw:ease-in tw:duration-150"
            leaveFrom="tw:opacity-100"
            leaveTo="tw:opacity-0"
          >
            <div className="tw:fixed tw:inset-0 tw:bg-black/40" />
          </Transition.Child>

          <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
            <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
              <Transition.Child
                as={Fragment}
                enter="tw:ease-out tw:duration-200"
                enterFrom="tw:opacity-0 tw:scale-95"
                enterTo="tw:opacity-100 tw:scale-100"
                leave="tw:ease-in tw:duration-150"
                leaveFrom="tw:opacity-100 tw:scale-100"
                leaveTo="tw:opacity-0 tw:scale-95"
              >
                <Dialog.Panel className="tw:w-full tw:max-w-md tw:rounded-2xl tw:bg-white tw:p-6 tw:shadow-xl">
                  <Dialog.Title
                    as="span"
                    className="tw:block tw:text-lg tw:font-semibold tw:text-gray-900"
                  >
                    Account deactivated
                  </Dialog.Title>
                  <Dialog.Description
                    as="span"
                    className="tw:mt-2 tw:block tw:text-sm tw:text-gray-600"
                  >
                    Your account has been successfully deactivated. You’ll now
                    be signed out.
                  </Dialog.Description>

                  <div className="tw:mt-6 tw:flex tw:justify-end tw:gap-3">
                    <button
                      type="button"
                      className="tw:inline-flex tw:justify-center tw:rounded-xl! tw:bg-primary tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-white tw:hover:bg-primarySecond"
                      onClick={handleForceLogout}
                    >
                      OK
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Fragment>
  );
}

export default Account;
