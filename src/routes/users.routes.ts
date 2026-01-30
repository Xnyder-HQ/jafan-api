import { Router } from "express";
import { checks } from "../middleware/index";
import { UserRules } from "../rules/users.rules";
import { RoleRules } from "../rules/roles.rules";
import { DefaultRules } from "../rules/default.rules";
import UserController from "../controllers/users.controller";

class UserRoutes {
	router = Router();
	controller = new UserController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/root/users", [checks.verifyKey as any, checks.isRootKey as any], this.controller.getUsers as any);
		this.router.get("/root/search/users", [checks.verifyKey as any, checks.isRootKey as any, DefaultRules.forSearching], this.controller.searchUsers as any);
		this.router.get("/root/filter/users", [checks.verifyKey as any, checks.isRootKey as any, DefaultRules.forFiltering], this.controller.filterUsersSpecifically as any);
		this.router.get("/root/user/via/email", [checks.verifyKey as any, checks.isRootKey as any, UserRules.forEmail], this.controller.getUser as any);
		this.router.get("/root/user/via/phone", [checks.verifyKey as any, checks.isRootKey as any, UserRules.forFindingUserViaPhoneNumber], this.controller.getUser as any);
		this.router.get("/root/users/specifically", [checks.verifyKey as any, checks.isRootKey as any], this.controller.getUsersSpecifically as any);
		this.router.get("/root/user", [checks.verifyKey as any, checks.isRootKey as any, UserRules.forFindingUser], this.controller.getUser as any);

		this.router.get("/users", this.controller.publicGetUsers as any);
		this.router.get("/search/users", [DefaultRules.forSearching as any], this.controller.publicSearchUsers as any); 
		this.router.get("/user/via/username", [UserRules.forUpdatingUsername as any], this.controller.publicGetUser as any);
		this.router.get("/user", [UserRules.forFindingUser as any], this.controller.publicGetUser as any);

		this.router.get("/user/profile", [checks.verifyToken as any, checks.isUser as any], this.controller.getUserProfile as any);
		
		this.router.put("/user/add", [checks.verifyToken as any, checks.isUser as any, UserRules.forAdding, RoleRules.forFindingRoleAltOptional], this.controller.addUser as any);
		
		this.router.put("/user/update/profile/names", [checks.verifyToken as any, checks.isUser as any, UserRules.forUpdatingNames], this.controller.updateUserNames as any);
		this.router.put("/user/update/profile/details", [checks.verifyToken as any, checks.isUser as any, UserRules.forUpdatingDetails], this.controller.updateUserDetails as any);
		this.router.put("/user/update/profile/username", [checks.verifyToken as any, checks.isUser as any, UserRules.forUpdatingUsername], this.controller.updateUsername as any);
		this.router.put("/user/update/profile/address/details", [checks.verifyToken as any, checks.isUser as any, UserRules.forUpdatingAddressDetails], this.controller.updateUserAddressDetails as any);
		this.router.put("/user/update/profile/email", [checks.verifyToken as any, checks.isUser as any, UserRules.forEmail], this.controller.updateUserEmail as any);
		this.router.put("/user/update/profile/image", [checks.verifyToken as any, checks.isUser as any, UserRules.forProfileImageUpload], this.controller.updateUserProfileImage as any);
		
		this.router.put("/user/update/role", [checks.verifyToken as any, checks.isUser as any, UserRules.forFindingUser, RoleRules.forFindingRoleAlt], this.controller.updateUserRole as any);

		this.router.put("/user/access/grant", [checks.verifyToken as any, checks.isUser as any, UserRules.forFindingUser], this.controller.updateAccessGranted as any);
		this.router.put("/user/access/suspend", [checks.verifyToken as any, checks.isUser as any, UserRules.forFindingUser], this.controller.updateAccessSuspended as any);
		this.router.put("/user/access/revoke", [checks.verifyToken as any, checks.isUser as any, UserRules.forFindingUser], this.controller.updateAccessRevoked as any);

		this.router.delete("/user", [checks.verifyToken as any, checks.isUser as any, UserRules.forFindingUser], this.controller.deleteUser as any);
	}
}

export default new UserRoutes().router;